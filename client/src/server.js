import axios from 'axios';
import { API_URL } from './constants';

const server = axios.create({
    baseURL: "http://127.0.0.1:5000",
    withCredentials: true,
})

export default server;