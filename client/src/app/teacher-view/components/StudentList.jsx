"use client";

import React, { useEffect, useState } from 'react';
import server from '@/server';

const StudentList = () => {
    const [students, setStudents] = useState([]);

    const getStudents = async () => {
        const response = await server.get("/students");
        setStudents(response.data["students"]);
    }

    useEffect(() => {
        getStudents();
    }, []); 


    return (
        <div className="h-full w-1/3">
            {students.map(student => (
                <div key={student.id} className="bg-gray-200 p-4 m-2 rounded text-black">
                    {student.name}
                </div>
            ))}
        </div>
    )
};

export default StudentList;