import { Router } from "express";

const eventRouter = Router();

eventRouter.get('/', (req, res) => {
    res.send('Get all events')
})

eventRouter.get('/:id', (req, res) => {
    res.send('Get event details')
})

eventRouter.post('/', (req, res) => {
    res.send('Create event')
})

eventRouter.put('/:id', (req, res) => {
    res.send('Update event')
})

eventRouter.delete('/:id', (req, res) => {
    res.send('Delete event')
})

eventRouter.get('/user/:id', (req, res) => {
    res.send('Get all user events')
})

eventRouter.put('/user/:id/cancel', (req, res) => {
    res.send('Cancel event by user')
})

export default eventRouter;