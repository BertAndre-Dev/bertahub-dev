"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Upload } from "lucide-react";
import type { MarketplaceItem } from "@/redux/slice/super-admin/marketplace/marketplace";

const CATEGORY_OPTIONS = [
  "Fashion",
  "Automobile",
  "Furniture",
  "Carpentry",
  "Insurance",
  "Food & Drinks",
  "Services",
];

const MAX_IMAGES = 3;

export interface AddBusinessFormPayload {
  companyName: string;
  productName: string;
  link: string;
  productCategory: string;
  productDescription: string;
  marketPlaceId?: string;
}

export interface AddBusinessFormProps {
  readonly initialData?: MarketplaceItem | null;
  readonly onSubmit: (payload: AddBusinessFormPayload) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly loading?: boolean;
}

export default function AddBusinessForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: AddBusinessFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [link, setLink] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>(
    new Array(MAX_IMAGES).fill(null)
  );
  const [imageFiles, setImageFiles] = useState<(File | null)[]>(
    new Array(MAX_IMAGES).fill(null)
  );
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName ?? "");
      setLink(initialData.link ?? "");
      setProductName(initialData.productName ?? "");
      setProductCategory(initialData.productCategory ?? "");
      setProductDescription(initialData.productDescription ?? "");
    } else {
      setCompanyName("");
      setLink("");
      setProductName("");
      setProductCategory("");
      setProductDescription("");
    }
    setImagePreviews(new Array(MAX_IMAGES).fill(null));
    setImageFiles(new Array(MAX_IMAGES).fill(null));
  }, [initialData]);

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const nextPreviews = [...imagePreviews];
    const nextFiles = [...imageFiles];
    if (nextPreviews[index]) URL.revokeObjectURL(nextPreviews[index]!);
    nextPreviews[index] = URL.createObjectURL(file);
    nextFiles[index] = file;
    setImagePreviews(nextPreviews);
    setImageFiles(nextFiles);
  };

  const removeImage = (index: number) => {
    if (imagePreviews[index]) URL.revokeObjectURL(imagePreviews[index]!);
    const nextPreviews = [...imagePreviews];
    const nextFiles = [...imageFiles];
    nextPreviews[index] = null;
    nextFiles[index] = null;
    setImagePreviews(nextPreviews);
    setImageFiles(nextFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !companyName.trim() ||
      !productName.trim() ||
      !productCategory.trim() ||
      !productDescription.trim() ||
      !link.trim()
    ) {
      return;
    }
    let url: string;
    try {
      url = link.startsWith("http") ? link : `https://${link}`;
      new URL(url);
    } catch {
      return;
    }
    await onSubmit({
      companyName: companyName.trim(),
      productName: productName.trim(),
      link: url,
      productCategory: productCategory.trim(),
      productDescription: productDescription.trim(),
      marketPlaceId: initialData?.id,
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
        <div className="grid gap-4 sm:grid-cols-1">
          <div>
            <Label htmlFor="form-companyName">Name of Company</Label>
            <Input
              id="form-companyName"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-11 mt-1 border-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="form-companyLink">Link</Label>
            <Input
              id="form-companyLink"
              placeholder="Enter company link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="h-11 mt-1 border-gray-300"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="form-productName">Product Name</Label>
            <Input
              id="form-productName"
              placeholder="Enter product name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="h-11 mt-1 border-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="form-productCategory">Product Category</Label>
            <Select
              id="form-productCategory"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              options={[
                { label: "Select Category", value: "" },
                ...CATEGORY_OPTIONS.map((c) => ({ label: c, value: c })),
              ]}
              className="h-11 mt-1 border-gray-300"
            />
          </div>
          <div>
            <Label htmlFor="form-productDescription">Description</Label>
            <textarea
              id="form-productDescription"
              placeholder="Enter product description"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={4}
              className="mt-1 flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
        <p className="text-sm text-muted-foreground">
          Add images for preview. They will appear when you upload.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: MAX_IMAGES }, (_, i) => (
            <div
              key={i}
              className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-muted/30 min-h-[120px] flex flex-col items-center justify-center"
            >
              <input
                id={`form-productImage-${i}`}
                ref={(el) => {
                  fileInputRefs.current[i] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(i, e)}
              />
              {imagePreviews[i] ? (
                <div className="relative w-full h-full min-h-[120px]">
                  <img
                    src={imagePreviews[i]!}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRefs.current[i]?.click()}
                    >
                      Change
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(i)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor={`form-productImage-${i}`}
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 p-4 w-full h-full min-h-[120px]"
                  onClick={() => fileInputRefs.current[i]?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-[#0150AC]">Upload</span>
                </label>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          className="flex-1 h-11 text-white font-medium"
          style={{ backgroundColor: "#0150AC" }}
          disabled={loading}
        >
          {loading ? "Saving..." : initialData?.id ? "Update business" : "Add business"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
