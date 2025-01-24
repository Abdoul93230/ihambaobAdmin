import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const BackendUrl = process.env.REACT_APP_Backend_Url;

export default function AddCategorie() {
  const [categorie, setCategorie] = useState("");
  const [categories, setCategories] = useState([]);
  const [typeProduit, setTypeProduit] = useState("");
  const [choixCat, setChoixCat] = useState("");
  const [typess, setTypes] = useState([]);
  const [ImgCat, setImgCat] = useState(null);
  const [editCategory, setEditCategory] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, typesResponse] = await Promise.all([
          axios.get(`${BackendUrl}/getAllCategories`),
          axios.get(`${BackendUrl}/getAllType`),
        ]);

        setCategories(categoriesResponse.data.data || []);
        setTypes(typesResponse.data.data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, []);

  // Create Category
  const createCategory = async () => {
    if (categorie.trim().length < 3) {
      toast({
        title: "Error",
        description: "Category name must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (!ImgCat) {
      toast({
        title: "Error",
        description: "Please upload a category image",
        variant: "destructive",
      });
      return;
    }

    if (
      categories.some(
        (cat) => cat.name.toLowerCase() === categorie.toLowerCase()
      )
    ) {
      toast({
        title: "Error",
        description: "This category already exists",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", categorie);
    formData.append("image", ImgCat);

    try {
      const response = await axios.post(`${BackendUrl}/categorie`, formData);

      toast({
        title: "Success",
        description: response.data.message,
      });

      // Refresh categories
      const updatedCategories = await axios.get(
        `${BackendUrl}/getAllCategories`
      );
      setCategories(updatedCategories.data.data || []);

      // Reset form
      setCategorie("");
      setImgCat(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data || "Failed to create category",
        variant: "destructive",
      });
    }
  };

  // Delete Category
  const deleteCategory = async (id) => {
    try {
      const response = await axios.delete(`${BackendUrl}/supCategorie`, {
        data: { id },
      });

      toast({
        title: "Success",
        description: response.data.message,
      });

      // Refresh categories
      const updatedCategories = await axios.get(
        `${BackendUrl}/getAllCategories`
      );
      setCategories(updatedCategories.data.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  // Create Product Type
  const createProductType = async () => {
    if (typeProduit.length < 3) {
      toast({
        title: "Error",
        description: "Product type must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (!choixCat || choixCat === "choisir") {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post(`${BackendUrl}/createProductType`, {
        name: typeProduit,
        nameCate: choixCat,
      });

      toast({
        title: "Success",
        description: response.data.message,
      });

      setTypeProduit("");
      setChoixCat("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product type",
        variant: "destructive",
      });
    }
  };

  // Update Category
  const updateCategory = async () => {
    if (!editCategory || editCategory.name.trim().length < 2) {
      toast({
        title: "Error",
        description: "Invalid category name",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", editCategory.name.trim());

    if (editCategory.image) {
      formData.append("image", editCategory.image);
    }

    try {
      const response = await axios.put(
        `${BackendUrl}/updateCategorie/${editCategory.id}`,
        formData
      );

      toast({
        title: "Success",
        description: response.data.message,
      });

      // Refresh categories
      const updatedCategories = await axios.get(
        `${BackendUrl}/getAllCategories`
      );
      setCategories(updatedCategories.data.data || []);

      setEditCategory(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Category Name</Label>
                <Input
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label>Category Image</Label>
                <Input
                  type="file"
                  onChange={(e) => setImgCat(e.target.files[0])}
                />
              </div>
              <Button onClick={createCategory}>Add Category</Button>

              {/* Categories List */}
              <div className="mt-4 space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center space-x-2">
                      {cat.image && (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <span className="capitalize">{cat.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditCategory({
                            id: cat._id,
                            name: cat.name,
                            image: null,
                          })
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCategory(cat._id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Type Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create Product Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Product Type Name</Label>
                <Input
                  value={typeProduit}
                  onChange={(e) => setTypeProduit(e.target.value)}
                  placeholder="Enter product type"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={choixCat} onValueChange={setChoixCat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createProductType}>Add Product Type</Button>

              {/* Product Types List */}
              <div className="mt-4 space-y-2">
                {typess.map((type) => (
                  <div
                    key={type._id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex space-x-2">
                      <span>{type.name}</span>
                      <span className="text-muted-foreground">
                        (
                        {
                          categories.find((c) => c._id === type.clefCategories)
                            ?.name
                        }
                        )
                      </span>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                value={editCategory?.name || ""}
                onChange={(e) =>
                  setEditCategory((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label>Category Image</Label>
              <Input
                type="file"
                onChange={(e) =>
                  setEditCategory((prev) => ({
                    ...prev,
                    image: e.target.files[0],
                  }))
                }
              />
            </div>
            <Button onClick={updateCategory}>Update Category</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
