// Express is a framework for building APIs and web apps
// See also: https://expressjs.com/
import express from 'express'
// Initialize Express app
const app = express()

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept')
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    next()
})

// Serve static files from /public folder (useful when running Node locally, optional on Vercel).
app.use(express.static('public'))
// Define index.html as the root explicitly (useful on Vercel, optional when running Node locally).
app.get('/', (req, res) => { res.redirect('/index.html') })

// Enable express to parse JSON data
app.use(express.json())

// Our API is defined in a separate module to keep things tidy.
// Let's import our API endpoints and activate them.
import apiRoutes from './routes/api.js'
app.use('/', apiRoutes)

// Import and mount upload routes
import uploadRoutes from './routes/upload.js'
app.use('/api', uploadRoutes)


const port = 3001
app.listen(port, () => {
    console.log(`Express is live at http://localhost:${port}`)
})
