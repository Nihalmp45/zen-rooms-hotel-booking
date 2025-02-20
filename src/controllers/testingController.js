import yup from 'yup';

const testingSchema = yup.object({
    name: yup.string().required("name is required").min(3, "minimum length of 3 is required").max(35, "maximum of 35 is possible"),
    email: yup.string().email("Invalid email").required("email is required"),
    password: yup.string().required("password is required").min(8, "minimum length of 8 is needed"),
    phone: yup
        .string()
        .required("Phone number is required")
        .matches(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    address:yup.string(),
    age:yup.number(),
    type: yup.string().oneOf(["admin", "user"], "It must be either 'admin' or 'user'").default("admin"),
    rating: yup.number().oneOf([1,2,3,4,5],"rating must be of 1,2,3,4 or 5").required("rating is required"),
    date: yup
        .date()
        .required("Date is required")
        .min("2025-01-21", "Date must be after 2025-01-21")
        .max("2025-01-25", "Date must be before 2025-01-25")
});

export const sampleRegistration = async (req, res) => {
    try {
        const validateData = await testingSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

        res.status(200).json({ message: "Validation successful", data: validateData });
    } catch (error) {
        // Map through error.inner for more detailed field-specific messages
        const errorMessages = error.inner.map(err => ({ field: err.path, message: err.message }));
        res.status(400).json({ message: "Validation failed", errors: errorMessages });
    }
};
