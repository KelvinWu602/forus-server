const express = require('express')
const app = express()
const indexer_port = 2000
const { Client } = require('pg')
const requiredFields = ['id', 'datetime', 'typepost'];

app.use(express.json());

const client = new Client({
    user: 'forusserver',
    password: '87654321',
    host: '127.0.0.1',
    port: 8080,
    database: 'nicedatabase', //case-sensitive, all small letters
})

client.connect();

// listen to port
app.listen(indexer_port, () => {
  console.log(`Forus indexer listening on port ${indexer_port}`)
})

// Helper function: get the SQL field names and values
function get_params(json_data){
    var param_names = [];
    var param_inputs = [];

    for(var key in json_data) {
        param_names.push(key);
        param_inputs.push(json_data[key]);
    }
    console.log('Extracted param names:\t', param_names);
    console.log('Extracted param inputs:\t', param_inputs);

    return [param_names, param_inputs];
}

// Helper function: create the input string based on the field names
function create_insert_string(input_template, requiredFields, param_inputs){
    input_string = input_template;
    input_string += '(';
    for(i=0; i<requiredFields.length; i++){
        if (i!=0) input_string += ', '; // if we're on the second param or onwards, add "AND"
        input_string += requiredFields[i];
    }
    input_string += ') VALUES (';
    for(i=0; i<param_inputs.length; i++){
        if (i!=0) input_string += ', '; // if we're on the second param or onwards, add "AND"
        input_string += param_inputs[i];
    }
    input_string += ');'
    console.log(input_string);
    return input_string;
}

// "/insertrecord" implementation
app.post('/insertrecord', (req, response) => {
    const json_data = req.body;
    
    // Check if required fields are present
    const missingFields = requiredFields.filter(field => !(field in json_data));
    if (missingFields.length > 0) {
      return response.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    
    // Check for extra fields
    const extraFields = Object.keys(json_data).filter(field => !requiredFields.includes(field));
    if (extraFields.length > 0) {
      return response.status(400).json({ error: `Received extra fields: ${extraFields.join(', ')}` });
    }
    
    var [param_names, param_inputs] = get_params(json_data);
    var input_string = create_insert_string('INSERT INTO Records ', requiredFields, param_inputs);

    // Insert records into SQL table
    client.query(input_string, (err, result)=>{
        if(!err){
            console.log(result.rows);
            console.log("Successful: record instance has been inserted")
            return response.status(200).send("record inserted")
        } else {
            console.log("Error:", err.message);
            return response.status(500).send("Error: could not insert record");
        }
    });
})