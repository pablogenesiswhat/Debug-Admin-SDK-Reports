# Debug Admin SDK Reports

## Dependencies

- [1. node 10 or node 8](https://nodejs.org/)
- [2. npm](https://www.npmjs.com/)
- [3. Admin SDK API Active](https://console.cloud.google.com/apis/library/admin.googleapis.com?q=admin%20sdk&id=d0a160dd-c410-4fd0-a951-c47e05309cb9)
- [4. Google Service Account (CLIENT_ID and CLIENT_SECRET)](https://console.cloud.google.com/apis/credentials)

## Getting Started

Create file .env -> CLIENT_SECRET and CLIENT_ID paste Google Service Account values ​​from point 4

```bash
# Install dependencies
npm install

# Development server
npm start
```

## Routes

### Get data 


```
   http://localhost:3000/get.customer
   http://localhost:3000/get.user
```

### Log
check console log for results

### View data

```
   http://localhost:3000/view.customer
   http://localhost:3000/view.user
```
