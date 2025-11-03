import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import CreateProductForm from "../forms/CreateProductForm";
import type { ProductData, ProductsData } from "../../utils/utils";
import UpdateProductForm from "../forms/UpdateProductForm";
import Modal from "../forms/DeleteModal";
import type { ModalHandle } from "../forms/DeleteModal";

export default function ProductsPanel() {
  const [data, setData] = useState<ProductsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<
    "create" | "increase_quantity" | "update" | null
  >(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(
    null
  );
  const [viewDetails, setViewDetails] = useState(false);
  const modalRef = useRef<ModalHandle>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/products/channel-a`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const responseData = await response.json();
        const parsedData = {
          ...responseData,
          Products: JSON.parse(responseData.Products),
        };
        setData(parsedData);
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to fetch products");
      }
    } catch (err) {
      setError(
        `Error connecting to server: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleActionClick = (
    actionType: typeof action,
    product: ProductData
  ) => {
    setSelectedProduct(product);
    setAction(actionType);
  };

  const handleBackToList = () => {
    setAction(null);
    setSelectedProduct(null);
    setViewDetails(false);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/products/channel-a/${selectedProduct?.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        const parsedData = {
          ...responseData,
          Products: JSON.parse(responseData?.Products),
        };
        setData(parsedData);
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to delete product");
      }
    } catch (err) {
      setError(
        `Error deleting product: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const handleDeleteClick = (product: ProductData) => {
    setSelectedProduct(product);
    modalRef.current?.open();
  };

  const renderContent = () => {
    if (action === "create") {
      return <CreateProductForm onSuccess={fetchProducts} />;
    }

    switch (action) {
      case "increase_quantity":
        return (
          <div className="text-gray-300">
            Increase quantity form for {selectedProduct?.name}{" "}
            {selectedProduct?.id}
          </div>
        );
      case "update":
        return (
          <UpdateProductForm
            onSuccess={fetchProducts}
            product={selectedProduct!}
            handleActionClick={handleActionClick}
            handleBackToList={handleBackToList}
          />
        );
      default:
        if (viewDetails && selectedProduct) {
          const formattedDate: string = getFormattedDate(selectedProduct);

          return (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-cyan-400">
                Product Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-gray-300">
                <div>
                  <span className="font-semibold text-cyan-300">ID:</span>{" "}
                  {selectedProduct.id}
                </div>
                <div>
                  <span className="font-semibold text-cyan-300">
                    Product Name:
                  </span>{" "}
                  {selectedProduct.name}
                </div>
                <div>
                  <span className="font-semibold text-cyan-300">
                    Expiry Date:
                  </span>{" "}
                  {formattedDate}
                </div>
                <div>
                  <span className="font-semibold text-cyan-300">Price:</span> $
                  {selectedProduct.price.toFixed(2)}
                </div>
                <div>
                  <span className="font-semibold text-cyan-300">
                    Quantity:{" "}
                  </span>
                  {selectedProduct.quantity.toFixed(0)}
                </div>
                <div>
                  <span className="font-semibold text-cyan-300">
                    Trader type:{" "}
                  </span>
                  {selectedProduct["trader-type"].toUpperCase()}
                </div>
              </div>
            </div>
          );
        }
    }
  };

  function getFormattedDate(product: ProductData) {
    const expiryDate: Date = new Date(product["expiry-date"]);
    const formatedDate: string = expiryDate.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return formatedDate;
  }

  if (action || viewDetails) {
    return (
      <div className="bg-gray-800 border-2 justify-between border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50">
        <Modal
          ref={modalRef}
          onConfirm={handleDelete}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmClassName="px-6 py-3 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all duration-200 hover:shadow-lg hover:shadow-red-400/50 text-white font-semibold"
          cancelClassName="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 text-cyan-300 font-semibold"
          dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50 max-w-2xl w-full"
        >
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">
            Confirm Deletion
          </h2>
          <p className="text-gray-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-cyan-300">
              {selectedProduct?.name} {selectedProduct?.["trader-type"]}
            </span>
            ?
          </p>
          <p className="text-sm text-gray-400 mt-2">
            ID: {selectedProduct?.id}
          </p>
          <p className="text-sm text-red-400 mt-4">
            This action cannot be undone.
          </p>
        </Modal>
        <div className="flex justify-between items-center mb-6">
          <div
            className="flex gap-2 my-4 justify-start"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleBackToList}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold rounded border-2 border-gray-600 transition-all"
            >
              ← Back to Products
            </button>
          </div>
          {action === null && (
            <div className="flex gap-2 my-4 justify-end">
              <button
                //   onClick={() => handleActionClick("increase_quantity", product)}
                className="flex items-center mb-4 px-4 py-2 gap-3 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all text-white font-semibold"
                title="Increase quantity"
              >
                <Plus size={18} />
                Increase quantity
              </button>
              <button
                onClick={() => handleActionClick("update", selectedProduct!)}
                className="flex items-center justify-center mb-4 px-4 py-2 gap-3 bg-blue-600 hover:bg-blue-500 rounded border-2 border-blue-400 transition-all  text-white font-semibold"
                title="Update"
              >
                <Edit size={18} /> Update
              </button>
              <button
                onClick={() => handleDeleteClick(selectedProduct!)}
                className="flex items-center justify-center mb-4 px-4 py-2 gap-3 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all  text-white font-semibold"
                title="Delete"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>
          )}
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Modal
        ref={modalRef}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmClassName="px-6 py-3 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all duration-200 hover:shadow-lg hover:shadow-red-400/50 text-white font-semibold"
        cancelClassName="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 text-cyan-300 font-semibold"
        dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50 max-w-2xl w-full"
      >
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">
          Confirm Deletion
        </h2>
        <p className="text-gray-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-cyan-300">
            {selectedProduct?.name} {selectedProduct?.["trader-type"]}
          </span>
          ?
        </p>
        <p className="text-sm text-gray-400 mt-2">ID: {selectedProduct?.id}</p>
        <p className="text-sm text-red-400 mt-4">
          This action cannot be undone.
        </p>
      </Modal>
      <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold text-cyan-400">Products</h3>
          <button
            onClick={() => setAction("create")}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded border-2 border-cyan-400 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/50"
          >
            <Plus size={20} />
            Create Product
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900 border-2 border-red-500 text-red-200 rounded">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center text-cyan-300 py-8">
            Loading products...
          </div>
        ) : data && Array.isArray(data.Products) && data.Products.length > 0 ? (
          <div className="space-y-3">
            {data.Products.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setViewDetails(true);
                }}
                className="flex items-center justify-between px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded border-2 border-cyan-400 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/50 cursor-pointer"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-cyan-300">
                    {product.name}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {getFormattedDate(product)}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Price</p>
                    <p className="font-bold text-cyan-300">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        handleActionClick("increase_quantity", product)
                      }
                      className="p-2 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all"
                      title="Increase quantity"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      onClick={() => handleActionClick("update", product)}
                      className="p-2 bg-blue-600 hover:bg-blue-500 rounded border-2 border-blue-400 transition-all"
                      title="Update"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="p-2 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No products found
          </div>
        )}
      </div>
    </div>
  );
}
