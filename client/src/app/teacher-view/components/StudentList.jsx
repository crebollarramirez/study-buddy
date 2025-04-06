"use client";

import React, { useEffect, useState } from 'react';
import Prompt from '@/app/teacher-view/components/Prompt';
import server from '@/server';


const StudentList = () => {

    {/* TODO UNCOMMENT ALL THIS

    TODO change 'var' back to 'const' right here!!!
    var [students, setStudents] = useState([]);

    const getStudents = async () => {
        const response = await server.get("/students");
        setStudents(response.data["students"]);
    }

    useEffect(() => {
        getStudents();
    }, []); 
    */}

    //Dummy students TODO COMMENT THIS OUT
    var students = [
        { id: 1, name: "John Doe" },
        { id: 2, name: "Jane Smith" },
        { id: 3, name: "Alice Johnson" },
        { id: 4, name: "Bob Brown" },
    ];



    return (
        <div className="h-full w-1/3 grid grid-cols-[100%] grid-rows-[30%_70%]">
            <div className = "flex row-span-1 flex-col col-span-1 ">
                {students.map(student => (
                    <div key={student.id} className="bg-red-100 p-1 m-2 rounded text-black overflow-hidden">
                        {student.name}
                    </div>
            ))}
            </div>
            

            <div className="h-full w-full justify-center  flex row-span-1 col-span-1">
                <Prompt />
            </div>
        </div>
    )
};

export default StudentList;