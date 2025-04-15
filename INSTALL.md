Project Installation and Setup
==============================

This guide provides instructions for setting up and testing the project using Docker and Docker Compose. Follow the steps below to get your development environment up and running smoothly.

# 🛠️Installations  

## Prerequisites  
Before setting up the project, ensure you have the following installed:  
- **[MongoDB](https://www.mongodb.com/products/platform/cloud)**: Create a cluster and generate the DB URL, username, and password.  
- **[GROQ](https://groq.com/)**: Create an API key.  
- **Create a `.env` file** in the `api` folder with the following details:  
```env
ATLAS_URI = ...
DATABASE = cookbook
GROQ_API_KEY = ...
PORT = 8000

```
*   (Optional) [Python 3.11](https://www.python.org/downloads/) and [pytest 7.4.4](https://docs.pytest.org/) for testing the API
*   (Optional) [Node.js](https://nodejs.org/en/download/) and [npm](https://docs.npmjs.com/cli/v7/commands/npm) for frontend testing

## 📊 Dataset
You can find the dataset used for this project [here](https://drive.google.com/file/d/12CZFb7Ugmiw9zQ7M_qpRsn7pmaV1zW0c/view?usp=sharing)

To import the dataset into MongoDB, checkout the commandline tools section within the cluster. Data Import and Export Tools section of the page should contain the necessary command to import your data to the cluster. 

Here is the command that you would find in it
```bash
mongoimport --uri mongodb+srv://<USERNAME>:<PASSWORD>@cluster0.ve4gdtc.mongodb.net/<DATABASE> --collection <COLLECTION> --type <FILETYPE> --file <FILENAME> --jsonArray
```

Add the jsonArray flag at the end as shown to import all of the data at once.


## 🔧 Backend Installation

Follow these steps to set up and run the backend server:

1. **Navigate to the API folder**:
   ```bash
   cd api
   
2. **Install required dependencies**:
    ```bash
    pip install -r requirements.txt

3. **Run the application server**:
   ```bash
   python -m uvicorn main:app --reload



### 🛠️Trouble Shooting

In case you run into any issues running the above commands, some operating systems may require you to use `python3` instead of `python` and `pip3` instead of `pip`.<br><br>

## 🎨Frontend Installation

To set up the front end React app, do:
1. **Navigate to the frontend folder**:
   ```bash
   cd frontend

   
2. **Install required dependencies**:
    ```bash
    npm install

3. **If the above command fails, use the following alternative:**:
   ```bash
   npm install --legacy-peer-deps
   
4. **Start the React app:**
   ```bash
   npm start
