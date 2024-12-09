// server.js
const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const { Firestore } = require('@google-cloud/firestore');
const tf = require('@tensorflow/tfjs-node');
const { v4: uuidv4 } = require('uuid');

// Firestore setup
const firestore = new Firestore();

const savePredictionToFirestore = async (data) => {
    await firestore.collection('predictions').doc(data.id).set(data);
};

const getPredictionHistoriesFromFirestore = async () => {
    const snapshot = await firestore.collection('predictions').get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        history: doc.data(),
    }));
};

// Model setup
const loadModel = async () => {
    return await tf.loadGraphModel('gs://asclepius-ml-models/model/model.json');
};

const predictModel = async (imageBuffer) => {
    const model = await loadModel();
    const imageTensor = tf.node.decodeImage(imageBuffer, 3);
    const resizedImage = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const normalizedImage = resizedImage.div(tf.scalar(255.0));

    const prediction = model.predict(normalizedImage.expandDims(0));
    return prediction.dataSync()[0];
};

// Define the routes
const initPredictRoutes = (server) => {
    server.route({
        method: 'POST',
        path: '/predict',
        options: {
            payload: {
                maxBytes: 1000000, // 1MB
                output: 'stream',
                parse: true,
                allow: 'multipart/form-data', // Ensure only multipart is accepted
            },
        },
        handler: async (request, h) => {
            try {
                // Access the image file sent by frontend
                const file = request.payload.image;
                if (!file) {
                    console.log('Image not found');
                    throw Boom.badRequest('Image not found');
                }

                // Process the image with the model
                const predictionResult = await predictModel(file);

                // Determine the prediction result
                const result = predictionResult > 0.5 ? 'Cancer' : 'Non-cancer';
                const suggestion = result === 'Cancer'
                    ? 'Please consult a doctor immediately!'
                    : 'No signs of cancer detected.';

                // Generate prediction ID and createdAt
                const id = uuidv4();
                const createdAt = new Date().toISOString();

                // Save the prediction result to Firestore
                await savePredictionToFirestore({ id, result, suggestion, createdAt });

                // Return the response
                return h.response({
                    status: 'success',
                    message: 'Model predicted successfully',
                    data: { id, result, suggestion, createdAt },
                }).code(200);
            } catch (error) {
                console.error(error);
                return Boom.internal('An error occurred during prediction');
            }
        },
    });
};

const initHistoryRoutes = (server) => {
    server.route({
        method: 'GET',
        path: '/predict/histories',
        handler: async (request, h) => {
            try {
                const histories = await getPredictionHistoriesFromFirestore();

                return h.response({
                    status: 'success',
                    data: histories,
                }).code(200);
            } catch (error) {
                console.error(error);
                return Boom.internal('Failed to fetch prediction histories');
            }
        },
    });
};

// Server setup
const init = async () => {
    const server = Hapi.server({
        port: 8080,
        host: '0.0.0.0',
        routes: {
            cors: true, // Enable CORS for frontend access
        },
    });

    // Add extension to handle large payload errors
    server.ext('onPreResponse', (request, h) => {
        const response = request.response;
        if (response.isBoom && response.output.statusCode === 413) {
            return h.response({
                status: 'fail',
                message: 'File too large. Maximum file size is 1MB.',
            }).code(413);
        }
        return h.continue;
    });

    // Initialize routes
    initPredictRoutes(server);
    initHistoryRoutes(server);

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
