import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import './App.css';

type Artwork = {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  date_start: string;
  date_end: string;
  isChecked?: boolean;
};

type CheckedRows = { [key: number]: boolean };

function App() {
  const [data, setData] = useState<Artwork[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [checkedRows, setCheckedRows] = useState<CheckedRows>({});
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const overlayPanelRef = useRef<OverlayPanel>(null);

  const fetchData = async (page: number): Promise<Artwork[]> => {
    const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`);
    const resData = await response.json();
    return resData.data.map((row: Artwork) => ({
      ...row,
      isChecked: checkedRows[row.id] || false,
    }));
  };
  

  const loadPageData = async (page: number) => {
    const rows = await fetchData(page);
    setData(rows);

    const allSelected = rows.every((row) => checkedRows[row.id]);
    setSelectAll(allSelected);
  };

  useEffect(() => {
    loadPageData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem('checkedRows', JSON.stringify(checkedRows));
  }, [checkedRows]);

  const handleApiChanges = (page: number) => {
    setCurrentPage(page);
  };

  const handleCheckboxChange = (row: Artwork) => {
    const updatedCheckedRows = {
      ...checkedRows,
      [row.id]: !checkedRows[row.id],
    };
    setCheckedRows(updatedCheckedRows);

    const updatedData = data.map((item) =>
      item.id === row.id ? { ...item, isChecked: !item.isChecked } : item
    );
    setData(updatedData);

    const allSelected = data.every((item) => updatedCheckedRows[item.id]);
    setSelectAll(allSelected);
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const updatedCheckedRows: CheckedRows = {};
    const updatedData = data.map((row) => {
      updatedCheckedRows[row.id] = newSelectAll;
      return { ...row, isChecked: newSelectAll };
    });

    setCheckedRows(updatedCheckedRows);
    setData(updatedData);
  };

  const handleSelectRows = async () => {
    const numRows = parseInt(value, 10);
    if (isNaN(numRows) || numRows <= 0) return;

    let remaining = numRows;
    let page = currentPage;
    const updatedCheckedRows = { ...checkedRows };

    while (remaining > 0) {
      const rows = await fetchData(page);
      const selectableRows = rows.filter((row) => !updatedCheckedRows[row.id]);
      const toSelect = Math.min(remaining, selectableRows.length);

      for (let i = 0; i < toSelect; i++) {
        updatedCheckedRows[selectableRows[i].id] = true;
      }

      remaining -= toSelect;

      if (remaining > 0) {
        page += 1;
      } else {
        setData(rows);
      }
    }

    setCheckedRows(updatedCheckedRows);
    setCurrentPage(page);
    overlayPanelRef.current?.hide();
  };

  const valueOfPaginate = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="card">
      <DataTable
        value={data}
        rows={12}
        className="w-[90%] mx-auto border"
      >
        
        <Column
          header={
            <Checkbox
              onChange={handleSelectAll}
              checked={selectAll}
              className="p-checkbox"
            />
          }
          body={(rowData) => (
            <Checkbox
              onChange={() => handleCheckboxChange(rowData as Artwork)}
              checked={checkedRows[rowData.id] || false}
              className="p-checkbox"
            />
          )}
          style={{ width: '3em' }}
        />

        <Column
          field="title"
          header={
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
                onClick={(e) => overlayPanelRef.current?.toggle(e)}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>

              <OverlayPanel ref={overlayPanelRef} className='mt-10'>
                <div className="flex flex-col">
                  <InputText
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="mb-3 border"
                  />
                  <Button onClick={handleSelectRows} className="text-sm">
                    Submit
                  </Button>
                </div>
              </OverlayPanel>
              Title
            </div>
          }
          className="border-t bg-white py-2"
        ></Column>

       
        <Column field="place_of_origin" header="Place" className="border-t bg-white py-2"></Column>
        <Column field="artist_display" header="Artist Display" className="border-t bg-white py-2"></Column>
        <Column field="date_start" header="Start Date" className="border-t bg-white py-2 w-[150px]"></Column>
        <Column field="date_end" header="End Date" className="border-t bg-white py-2 w-[150px]"></Column>
      </DataTable>

      
      <div className="flex gap-10 justify-center mt-5">
        {valueOfPaginate.map((btn) => (
          <button
            key={btn}
            onClick={() => handleApiChanges(btn)}
            className={`p-button p-button-outlined ${currentPage === btn ? 'p-button-primary' : ''}`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
