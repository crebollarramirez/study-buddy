import React from "react";

var counterState = 0;

export default function Counter() {
    return (
      <div className="bg-green-400 justify-center flex flex-row items-center h-full">
      <p> {counterState} </p>
      </div>
    );
  }

  export function incrementCounter(){
    counterState += 1;
    setCounter(counterState);
    console.log(counterState);
  };
  export function setCounter(value){
    counterState = value;
  };