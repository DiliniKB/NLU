import express, { Request, Response } from 'express';
import { processInput } from '../services/nluPipeline';

const router = express.Router();

router.post('/process', (req, res) => {
    handleProcessRoute(req, res).catch(err => {
        console.error('Unhandled error:', err);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Something went wrong'
        });
    });
});

// Separate async handler
async function handleProcessRoute(req: Request, res: Response) {
    try {
        const { userId, message } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const result = await processInput(userId, message);
        res.json(result);
    } catch (error: any) {
        console.error('Error processing request:', error);
        res.status(500).json({
            error: 'Failed to process input',
            message: error.message
        });
    }
}

export default router;