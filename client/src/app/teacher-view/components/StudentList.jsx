"use client";

import React, { useEffect, useState } from 'react';
// import Prompt from '@/app/teacher-view/components/Prompt';
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
                <div key={student.id} className="bg-red-100 p-4 m-2 rounded text-black">
                    {student.name}
                </div>
            ))}

        {/* <div>
            <Prompt />
        </div> */}
        </div>
    )
};

export default StudentList;