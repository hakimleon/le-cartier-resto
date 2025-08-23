
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Table = {
    id: number;
    seats: number;
    status: 'available' | 'occupied' | 'reserved';
    shape: 'round' | 'square';
}

export function TableMap() {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    async function fetchTables() {
        const tablesSnapshot = await getDocs(collection(db, "tables"));
        const tablesList = tablesSnapshot.docs.map(doc => ({ ...doc.data(), id: parseInt(doc.id) } as Table));
        setTables(tablesList.sort((a, b) => a.id - b.id));
    }
    fetchTables();
  }, []);

  const handleTableSelect = (table: Table) => {
    if (table.status === 'available') {
      setSelectedTable(table.id === selectedTable ? null : table.id);
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-200 border-green-400 hover:bg-green-300';
      case 'occupied':
        return 'bg-red-200 border-red-400 cursor-not-allowed';
      case 'reserved':
        return 'bg-yellow-200 border-yellow-400 cursor-not-allowed';
      default:
        return 'bg-gray-200 border-gray-400';
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-center font-headline">Choisir une table</h3>
      <div className="grid grid-cols-3 gap-6">
        {tables.map((table) => (
          <div
            key={table.id}
            onClick={() => handleTableSelect(table)}
            className={cn(
              "w-24 h-24 flex flex-col items-center justify-center border-2 transition-all duration-200",
              table.shape === 'round' ? 'rounded-full' : 'rounded-md',
              getStatusColor(table.status),
              selectedTable === table.id && 'ring-4 ring-primary ring-offset-2',
              table.status === 'available' && 'cursor-pointer'
            )}
          >
            <span className="font-bold text-lg text-card-foreground">{table.id}</span>
            <span className="text-sm text-muted-foreground">{table.seats} places</span>
          </div>
        ))}
      </div>
       <div className="flex justify-center space-x-4 mt-6 text-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-200 border border-green-400"></div>Disponible</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-400"></div>Réservée</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-200 border border-red-400"></div>Occupée</div>
      </div>
    </div>
  );
}
