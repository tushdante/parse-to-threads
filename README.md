# Parse To Threads
Automatically send the Parse Webhook data to Threads.io

### Installation

Use `npm install` to install the required packages

Start the server by running `node index.js`

Threads also needs to be configured to have a verifed sending address, so this need to be done too

### Usage

The server will accpet any incoming `POST` requests sent by the Parse webhook and will create a new user
based on this `from` field set in the email. It will then hash this email address (MD5) into a hexadecimal string which is
used as a unique identifier for the person as well as contructing the `POST` body for the threads identify call.
The users email and name are added as traits.

The server then makes a tracking call to threads with all the available params sent by the Parse webhook as properties to threads.

#### Note

Please add your API keys before running the server. 
