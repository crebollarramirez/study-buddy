import axios from 'axios';
import { API_URL } from './constants';

const server = axios.create({
    baseURL: API_URL,
    withCredentials: true,
})

export default server;