import React, { useEffect, useState } from "react";
import { User } from "react-feather";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function ACustomers() {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allAddress, setAllAddress] = useState([]);
  const [allCommands, setAllCommands] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const [usersRes, profilesRes, addressesRes, commandsRes] =
        await Promise.all([
          axios.get(`${BackendUrl}/getUsers`),
          axios.get(`${BackendUrl}/getUserProfiles`),
          axios.get(`${BackendUrl}/getAllAddressByUser`),
          axios.get(`${BackendUrl}/getAllCommandes`),
        ]);
      setAllUsers(usersRes.data.data);
      setAllProfiles(profilesRes.data.data);
      setAllAddress(addressesRes.data.data);
      setAllCommands(commandsRes.data.commandes);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = allUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (
      direction === "next" &&
      currentPage < Math.ceil(filteredUsers.length / itemsPerPage)
    ) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleUserClick = (id) => {
    navigate(`/Admin/ACustomerDet/${id}`);
  };

  return (
    <div className="ACustomers p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Customers</h3>
        <div className="flex items-center space-x-2">
          <input
            type="search"
            placeholder="Search Customers"
            className="border rounded p-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead className="bg-gray-200 sticky top-0">
            <tr>
              <th className="border px-4 py-2">Img</th>
              <th className="border px-4 py-2">First Name</th>
              <th className="border px-4 py-2">Identifiant</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Phone Number</th>
              <th className="border px-4 py-2">Nbr Orders</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers.map((user) => {
              const profile = allProfiles.find(
                (prof) => prof.clefUser === user._id
              );
              const address = allAddress.find(
                (addr) => addr.clefUser === user._id
              );
              const commandCount = allCommands.filter(
                (cmd) => cmd.clefUser === user._id
              ).length;

              return (
                <tr
                  key={user._id}
                  className="hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleUserClick(user._id)}
                >
                  <td className="border px-4 py-2 text-center">
                    {profile?.image ? (
                      <img
                        src={profile.image}
                        alt="User"
                        className="w-10 h-10 rounded-full mx-auto"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-500" />
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    {address?.name || user.name || "none"}
                  </td>
                  <td className="border px-4 py-2">{user._id}</td>
                  <td className="border px-4 py-2">{user.email}</td>
                  <td className="border px-4 py-2">
                    {profile?.numero || user.phoneNumber || "none"}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {commandCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => handlePageChange("prev")}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm">
          Page {currentPage} of {Math.ceil(filteredUsers.length / itemsPerPage)}
        </span>
        <button
          onClick={() => handlePageChange("next")}
          disabled={
            currentPage === Math.ceil(filteredUsers.length / itemsPerPage)
          }
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ACustomers;
