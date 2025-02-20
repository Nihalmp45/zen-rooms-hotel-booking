import express from 'express'
import {checkAuth, logoutDetails, userLoginDetails, userSignupDetails} from '../controllers/userController.js'
import { sampleRegistration } from '../controllers/testingController.js'

const router = express.Router()

router.post("/user", userSignupDetails)
router.post("/user-login",userLoginDetails)
router.get("/logout",logoutDetails)
router.get('/check-auth',checkAuth)

router.post("/testing",sampleRegistration)


export default router