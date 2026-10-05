import { Router } from "express";

const authRouter = Router();

authRouter.post('/sign-up', (req, res) => {
    res.send('Sign Up')
})

authRouter.post('/login', (req, res) => {
    res.send('Login')
})

authRouter.post('/logout', (req, res) => {
    res.send('Logout')
})

export default authRouter;