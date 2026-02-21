import { debounce } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { Input, Pagination, Table, Select } from "antd";
import { pageSize } from "../../helpers";
import { useDispatch } from "react-redux";

const CustomDataTable = ({
  count,
  current,
  action,
  isLoading,
  columns,
  data,
  id,
  statusOptions = [],
  status = null,
  onStatusChange,
  setStatus,
  extraFilter,
}) => {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();

  // ✅ Debounced function
  const debouncedSearch = useRef(
    debounce((val, currentStatus) => {
      const params = { page: 1, search: val };
      if (id) params.id = id;
      if (currentStatus !== undefined && currentStatus !== null) params.status = currentStatus;
      dispatch(action(params));
    }, 500),
  ).current;

  useEffect(() => {
    debouncedSearch(search, status);
  }, [search]);

  const changePaginate = (page) => {
    const params = { page, search };
    if (id) params.id = id;
    if (status !== undefined && status !== null) params.status = status;
    dispatch(action(params));
  };

  return (
    <div align="end" className="mt-4 custom-table">
      {extraFilter}
      {setStatus && (
        <Select
          allowClear
          placeholder="Status"
          options={statusOptions}
          style={{ marginRight: 10 }}
          value={status}
          size="large"
          onChange={(value) => setStatus(value)}
        />
      )}
      <Input.Search
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: 350, marginBottom: 20 }}
        size="large"
        allowClear
      />
      <Table
        pagination={false}
        loading={isLoading}
        columns={columns}
        dataSource={data}
      />
      <Pagination
        onChange={changePaginate}
        total={count}
        current={current}
        style={{ marginTop: 20 }}
        pageSize={pageSize}
      />
    </div>
  );
};

export default CustomDataTable;

// import React, { useEffect, useState } from "react";
// import { Input, Pagination, Table } from "antd";
// import { useDispatch } from "react-redux";

// const CustomDataTable = ({
//   count,
//   current,
//   action,
//   isLoading,
//   columns,
//   data,
//   id,
//   pageSize=10,
// }) => {
//   const [search, setSearch] = useState("");
//   const [firstLoad, setFirstLoad] = useState(false);
//   const dispatch = useDispatch();
//   const changePaginate = (e) => {
//     id ? dispatch(action({ id, page: e })) : dispatch(action({ page: e }));
//   };
//   const onSearch = (e) => setSearch(e);
//   useEffect(() => {
//     if (firstLoad) {
//       id
//         ? dispatch(action({ id, page: 1, search }))
//         : dispatch(action({ page: 1, search }));
//     }
//     setFirstLoad(true);
//   }, [search]);
//   return (
//     <div align={"end"} className={"mt-4 custom-table"}>
//       <Input.Search
//         placeholder="Search"
//         onSearch={onSearch}
//         style={{
//           width: 350,
//           marginBottom: 20,
//         }}
//         size={"large"}
//       />
//       <Table
//         pagination={false}
//         loading={isLoading}
//         columns={columns}
//         dataSource={data}
//       />
//       <Pagination
//         onChange={changePaginate}
//         total={count}
//         current={current}
//         style={{ marginTop: 20 }}
//         pageSize={pageSize}
//       />
//     </div>
//   );
// };

// export default CustomDataTable;
