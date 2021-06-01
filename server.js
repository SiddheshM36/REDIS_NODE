const express = require('express')
const app = express()
const PORT = process.env.PORT || 8000 
const responseTime = require('response-time')
const axios = require('axios')
const redis = require('redis')
const { urlencoded } = require('body-parser')
const { promisify } = require('util')


//middlewares
app.use(urlencoded({ extended : false }))
app.use(express.json())
app.use(responseTime())


//redis client
const client = redis.createClient(6379)


//redis gives the headers with callbacks so we convert the callbacks to promoises using promisify
const GET_ASYNC = promisify(client.get).bind(client)

//set is used to save the key value pair in redis database
const SET_ASYNC = promisify(client.set).bind(client)



//routes
app.get('/', async(req, res)=>{
    try{
        const reply = await GET_ASYNC('result')
        if(reply){
            console.log('hey i have came from redis')
            res.send(JSON.parse(reply))
            return
        }
        
        const response = await axios.get('https://api.covid19api.com/summary')
        //save response to redis db in key value pair key is result and we have to convert json to string for storing it
        //after every 5sec the api will be call so that all changes in the api will display
        const saveResult = await SET_ASYNC('result', JSON.stringify(response.data), 'EX', 10)
        console.log('new data catched')
        res.status(202).json(response.data)
    }
    catch(err){
        res.status(403).json(err)
        console.log(err)
    }
        
})



//listening port
app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}...`)
}) 
