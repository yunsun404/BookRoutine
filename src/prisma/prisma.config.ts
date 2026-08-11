import * as dotenv from 'dotenv';
dotenv.config();

export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};