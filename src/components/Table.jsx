import React from 'react';

export default function Table({ columns = [], data = [] }){
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map((c,i)=>(<th key={i}>{c}</th>))}</tr>
        </thead>
        <tbody>
          {data.map((row,ri)=>(
            <tr key={ri}>{columns.map((c,ci)=>(<td key={ci}>{row[c] ?? '-'}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
