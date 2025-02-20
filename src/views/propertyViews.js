import express from 'express'
import {getHotelDetails, getHotelPhotos, getProperties, stripePayment} from '../controllers/propertyController.js'

const router = express.Router()

router.get("/get-properties", getProperties)
router.get("/hotel-details",getHotelDetails)
router.get("/hotel-photos",getHotelPhotos)
router.post("/create-checkout-session", stripePayment)


export default router