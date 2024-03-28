const express = require('express')
const app = express()
const server_port = 3000
const {Client} = require('pg')

app.use(express.json()); // add this so app can read json files in http request bodies

// create and connect new PSQL client
const client = new Client({
    user: 'forusserver',
    password: '87654321',
    host: '127.0.0.1',
    port: 8080,
    database: 'nicedatabase', //case-sensitive, all small letters
})

client.connect();

// listen to port
app.listen(server_port, ()=>{
    console.log(`Forus server listening on port ${server_port}`)
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
function create_select_string(input_template, num_of_params, param_names){
    input_string = input_template;
    for(i=0; i<num_of_params; i++){
        if (i!=0) input_string += ' AND '; // if we're on the second param or onwards, add "AND"
        input_string += param_names[i] + '=$' + (i+1);
    }
    console.log(input_string);
    return input_string;
}

/////////////////// "/searchrecords" implementation /////////////////////
// the request body should contain a json file with the search variables
// e.g. {"datetime": "2023-03-28T06:30:00.000Z" , "typepost": false}
// e.g. {"datetime": "2024-03-28T06:30:00.000Z"}
app.get('/searchrecords', (req, response) => {

    var json_data = req.body;
    var [param_names, param_inputs] = get_params(json_data);

    var input_string = create_select_string('SELECT id FROM Records WHERE ', Object.keys(json_data).length, param_names);

    client.query(input_string, param_inputs, (err, result)=>{
        if(err){
            console.log(err.message);
            response.status(500).send("Error: could not retrieve ids from database");
        } else {
            console.log("Successful: record ids obtained from database table");
            var list = []
            for (row of result.rows){
                list.push(row['id']);
            }
            response.status(200).send(list);
        }
    });

    // client.query(input_string, param_inputs)
    // .then(result=> {
    //     console.log("Successful: record ids obtained from database table");
    //     var list = []
    //     for (row of result.rows){
    //         list.push(row['id']);
    //     }
    //     response.status(200).send(list);
    // })
    // .catch(err => {
    //     console.log(err.message);
    //     response.status(500).send("Error: could not retrieve ids from database");
    // })
});