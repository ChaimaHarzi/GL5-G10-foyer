/**
 * Base path of the Spring Boot API. It is relative to the page address: in Kubernetes, Nginx forwards
 * /tpFoyer17/ to the backend Service, and in development `ng serve` does the same (proxy.conf.json).
 */
export const API_URL = '/tpFoyer17/api';
