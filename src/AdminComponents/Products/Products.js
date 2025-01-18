import React, { useEffect, useState } from "react";
import { Star, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import ReactPaginate from "react-paginate";

const BackendUrl = process.env.REACT_APP_Backend_Url;

function Products() {
  const [products, setProduct] = useState([]);
  const [types, setTypes] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [perPage] = useState(20);
  const [totalPage, setTotalPage] = useState(0);
  const [selectedType, setSelectedType] = useState("All");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsResponse, typesResponse] = await Promise.all([
          axios.get(`${BackendUrl}/Products`),
          axios.get(`${BackendUrl}/getAllType/`),
        ]);

        if (selectedType === "All" && productsResponse.data.data.length > 0) {
          setProduct(productsResponse.data.data);
          setTotalPage(Math.ceil(productsResponse.data.data.length / perPage));
          setError(null);
        }

        setTypes(typesResponse.data.data);
      } catch (error) {
        setError(error.response?.data?.message || "An error occurred");
      }
    };

    fetchProducts();
  }, [selectedType]);

  const searchProductByType = async (typeId) => {
    try {
      const response = await axios.get(
        `${BackendUrl}/searchProductByType/${typeId}`
      );
      setProduct(response.data.products);
      setTotalPage(Math.ceil(response.data.products.length / perPage));
      setCurrentPage(0);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred");
    }
  };

  const searchProductByName = async () => {
    if (searchName.length < 2) {
      alert("Product name must be at least 2 characters long");
      return;
    }

    try {
      const response = await axios.get(
        `${BackendUrl}/searchProductByName/${searchName}`
      );
      setProduct(response.data.products);
      setTotalPage(Math.ceil(response.data.products.length / perPage));
      setCurrentPage(0);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred");
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await axios.get(`${BackendUrl}/Products`);
      if (response.data.data.length > 0) {
        setProduct(response.data.data);
        setTotalPage(Math.ceil(response.data.data.length / perPage));
        setCurrentPage(0);
        setError(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred");
    }
  };

  const displayedProducts = products.slice(
    currentPage * perPage,
    (currentPage + 1) * perPage
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Products <span className="text-gray-500">/ {selectedType}</span>
        </h2>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {types.slice(0, 5).map((type, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedType(type.name);
                  searchProductByType(type._id);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                {type.name}
              </button>
            ))}
            <button
              onClick={() => {
                setSelectedType("All");
                setError(null);
                fetchAllProducts();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors"
            >
              All
            </button>
          </div>

          <div className="flex space-x-2">
            <div className="relative">
              <input
                type="search"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search Products"
                className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
            <button
              onClick={searchProductByName}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="text-center text-red-500 text-xl py-8">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedProducts.map((product, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 hover:shadow-xl"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">Chaussures</span>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={20} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">${product.prix}</p>
                  <p className="text-gray-500 text-sm mb-4">
                    {product.description.substring(0, 50)}...
                  </p>
                  <Link
                    to={`/Admin/ProductDet/${product._id}`}
                    className="flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
                  >
                    View More
                    <ChevronRight size={20} className="ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {products.length > perPage && (
            <div className="flex justify-center mt-8">
              <ReactPaginate
                pageCount={totalPage}
                pageRangeDisplayed={5}
                marginPagesDisplayed={2}
                onPageChange={(selected) => setCurrentPage(selected.selected)}
                containerClassName="flex space-x-2"
                pageClassName="px-3 py-1 rounded-full hover:bg-gray-200"
                activeClassName="bg-blue-500 text-white"
                previousClassName="px-3 py-1 rounded-full hover:bg-gray-200"
                nextClassName="px-3 py-1 rounded-full hover:bg-gray-200"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Products;
