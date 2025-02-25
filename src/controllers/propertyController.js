import axios from "axios";
import { config } from "dotenv";
import Stripe from "stripe";
import Redis from "ioredis"; 

config(); // Load environment variables


const redis = new Redis();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export const getProperties = async (req, res) => {
  try {
    // Retrieve query parameters from the client request
    const {
      query,
      arrival_date,
      departure_date,
      adults,
      children_age,
      room_qty,
    } = req.query;

    if (!query || !arrival_date || !departure_date) {
      return res
        .status(400)
        .json({
          error: "Query, arrival_date, and departure_date are required.",
        });
    }

    const cacheKey = `properties:${query}:${arrival_date}:${departure_date}:${adults}:${children_age}:${room_qty}`;
    
    // Check if data is cached
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("Serving from cache");
      return res.status(200).json(JSON.parse(cachedData));
    }

    // First API call: Search destination to get dest_id
    const destinationOptions = {
      method: "GET",
      url: "https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination",
      params: { query },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY, // Use environment variable
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    };

    const destinationResponse = await axios.request(destinationOptions);

    // Ensure the data contains the required fields
    if (
      !destinationResponse.data?.data?.[0]?.dest_id ||
      destinationResponse.data?.data.length === 0
    ) {
      return res.status(404).json({ error: "Destination not found." });
    }

    const dest_id = destinationResponse.data.data[0].dest_id; // Extract dest_id

    // Second API call: Search hotels using dest_id
    const hotelsOptions = {
      method: "GET",
      url: "https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels",
      params: {
        dest_id, // Pass the destination ID from the first call
        search_type: "CITY", // Optional: You can adapt this to "district" if needed
        arrival_date,
        departure_date,
        adults,
        children_age,
        room_qty,
        page_number: "1",
        units: "metric",
        temperature_unit: "c",
        languagecode: "en-us",
        currency_code: "INR",
      },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    };

    const hotelsResponse = await axios.request(hotelsOptions);

    // Cache the response for 1 hour (3600 seconds)
    await redis.setex(cacheKey, 3600, JSON.stringify(hotelsResponse.data));

    // Return the final data (hotels) from the second API call
    return res.status(200).json(hotelsResponse.data);
  } catch (error) {
    console.error("Error fetching properties:", error.message);

    // Handle API errors
    return res
      .status(500)
      .json({ error: "Error fetching data. Please try again later." });
  }
};

// Fetch details for a specific hotel
export const getHotelDetails = async (req, res) => {
  try {
    const { hotel_id, arrival_date, departure_date } = req.query;

    if (!hotel_id || !arrival_date || !departure_date) {
      return res
        .status(400)
        .json({
          error: "hotel_id, arrival_date, and departure_date are required.",
        });
    }

    const cacheKey = `hotelDetails:${hotel_id}:${arrival_date}:${departure_date}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      console.log("Serving from cache:", cacheKey);
      return res.status(200).json(JSON.parse(cachedData));
    }

    const hotelDetailsOptions = {
      method: "GET",
      url: "https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelDetails",
      params: {
        hotel_id,
        arrival_date,
        departure_date,
      },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    };

    const hotelDetailsResponse = await axios.request(hotelDetailsOptions);

    await redis.set(cacheKey, JSON.stringify(hotelDetailsResponse.data), "EX", 3600);

    return res.status(200).json(hotelDetailsResponse.data);
  } catch (error) {
    console.error("Error fetching hotel details:", error.message);
    return res
      .status(500)
      .json({ error: "Error fetching hotel details. Please try again later." });
  }
};

export const getHotelPhotos = async (req, res) => {
  try {
    const { hotel_id } = req.query;

    if (!hotel_id) {
      return res.status(400).json({ error: "hotel_id is required." });
    }

    const cacheKey = `hotelPhotos:${hotel_id}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      console.log("Serving from cache:", cacheKey);
      return res.status(200).json(JSON.parse(cachedData));
    }

    const hotelPhotosOptions = {
      method: "GET",
      url: "https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelPhotos",
      params: { hotel_id },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    };

 


    const hotelPhotosResponse = await axios.request(hotelPhotosOptions);

    await redis.set(cacheKey, JSON.stringify(hotelPhotosResponse.data), "EX", 3600);

    return res.status(200).json(hotelPhotosResponse.data);
  } catch (error) {
    console.error("Error fetching hotel photos:", error.message);
    return res
      .status(500)
      .json({ error: "Error fetching hotel photos. Please try again later." });
  }
};

export const stripePayment = async (req, res) => {
  let { hotel_name, price } = req.body;

  if (!price || isNaN(price)) {
    return res.status(400).json({ error: "Invalid price provided." });
  }

  
  price = Math.round(Number(price) * 1000)*1000;
  console.log("Processed price in backend:", price);

  if (price < 5000) {
    // 5000 paise = ₹50
    return res.status(400).json({ error: "Minimum payment amount is ₹50." });
  }

  console.log("Final price in paise:", price);

  try {

    const cacheKey = `stripeSession:${hotel_name}:${price}`;
    const cachedSession = await redis.get(cacheKey);

    if (cachedSession) {
      console.log("Serving Stripe session from cache:", cacheKey);
      return res.status(200).json({ url: JSON.parse(cachedSession) });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: hotel_name },
            unit_amount: price, // Now always in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:5173/success",
      cancel_url: "http://localhost:5173/cancel",
    });

    await redis.set(cacheKey, JSON.stringify(session.url), "EX", 600);

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error); // Logs full Stripe error
    res.status(500).json({ error: error.message }); // Send error message to frontend
  }
};
