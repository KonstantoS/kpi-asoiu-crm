# KPI Web (ASU Department Department portal)

! Required packages: node, postgresql, npm

## How to install
### 0. Do ` cd ` to project directory 
### 1. PostgresSQL user and database creation
    sudo -u postgres psql
    postgres=# CREATE DATABASE kpi_web_api;
    postgres=# CREATE USER asoiu WITH password 'kpi-asoiu';
    postgres=# GRANT ALL privileges ON DATABASE kpi_web_api TO asoiu;
    postgres=# \q
    
### 2. Importing of tables
    psql postgres://asoiu:kpi-asoiu@localhost/kpi_web_api
    
    # Locate your folder with .sql file
    
    kpi_web_api=> \i /% absolute_path %/kpi-asoiu-crm/kpi-asoiu-crm.sql
    kpi_web_api=> \q

### 3. Installing dependencies
In project root:

    npm install
    
Then replace **bold**node_modules/formidable**bold** module with patched one from git root 

## How to use
### Starting server
Start:

    DEBUG=kpi-asoiu-crm:* npm start    

or

    npm start
    
### Log in
Send a `POST` **bold**x-www-form-urlencoded request**bold** to `localhost:2000/login` with fields `login:admin, passwd:asukpiua`
You will receive that cookies:
    
    _auth: % your uuid token%
    uid: % your user id%
    
Now you can use API when sending `Authorization` header with your requests with pattarn `%uid%:%token%`

Example:`Authorization   1:089f1a40-5b60-4098-9446-fe2069a775c3`

### Using
Just as all RESTful APIs:

`GET | POST | PUT | DELETE` ***bold*** /item/:id ***bold*** 
