const API_URL = 'http://localhost:5000/api';

// И обновите все axios запросы, например:
const [adminsRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
    axios.get(`${API_URL}/superadmin/admins`, { 
        headers: { Authorization: `Bearer ${token}` } 
    }),
    axios.get(`${API_URL}/superadmin/teachers`, { 
        headers: { Authorization: `Bearer ${token}` } 
    }),
    axios.get(`${API_URL}/superadmin/classes`, { 
        headers: { Authorization: `Bearer ${token}` } 
    }),
    axios.get(`${API_URL}/superadmin/subjects`, { 
        headers: { Authorization: `Bearer ${token}` } 
    })
]);