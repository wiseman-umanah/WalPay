import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaTimes, FaSync } from "react-icons/fa";
import ReactCrop, { convertToPixelCrop, type PixelCrop, type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { countChars, generateSlugValue, sanitizeSlug, validateSlug } from "../utils/utils";

interface PaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    description: string;
    amountFlow: number;
    successMessage: string;
    redirectUrl?: string;
    slug: string;
    imageBase64?: string | null;
  }) => Promise<void>;
}

const MAX_DESCRIPTION_LENGTH = 255;
const MAX_SUCCESS_MESSAGE_LENGTH = 50;
const MAX_NAME_LENGTH = 50;
const MIN_SLUG_LENGTH = 5;
const MAX_SLUG_LENGTH = 20;
const BASE_PAYMENT_PATH = typeof window !== "undefined" ? `${window.location.origin}/payment/` : "/payment/";
const INITIAL_CROP: PercentCrop = {
  unit: "%",
  width: 100,
  height: 100,
  x: 0,
  y: 0,
};



const PaymentLinkModal: React.FC<PaymentLinkModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [redirectLink, setRedirectLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("Thank you");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<PercentCrop>({ ...INITIAL_CROP });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [imageStage, setImageStage] = useState<"idle" | "cropping" | "preview">("idle");
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [productNameError, setProductNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [successMessageError, setSuccessMessageError] = useState<string | null>(null);
  const [amountFlow, setAmountFlow] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const wordCount = useMemo(() => countChars(description), [description]);

  const productNameWordCount = useMemo(() => countChars(productName), [productName]);

  const successWordCount = useMemo(() => countChars(successMessage), [successMessage]);

  useEffect(() => {
    if (isOpen) {
      setProductName("");
      setDescription("");
      setRedirectLink("");
      setImageFile(null);
      setImagePreviewUrl(null);
      setSuccessMessage("Thank you");
      setAmountFlow(1);
      const initialSlug = generateSlugValue(MAX_SLUG_LENGTH);
      setSlug(initialSlug);
      setSlugError(validateSlug(initialSlug, MIN_SLUG_LENGTH, MAX_SLUG_LENGTH));
      setCrop({ ...INITIAL_CROP });
      setCompletedCrop(null);
      setCroppedFile(null);
      setFinalImageUrl(null);
      setImageStage("idle");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      setCompletedCrop(null);
      setCroppedFile(null);
      setImageStage("idle");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);
    setImageStage("cropping");

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (finalImageUrl) {
        URL.revokeObjectURL(finalImageUrl);
      }
    };
  }, [finalImageUrl]);

  useEffect(() => {
    if (!imageElementRef.current || !canvasRef.current) {
      setCroppedFile(imageFile);
      return;
    }

    if (
      !completedCrop ||
      completedCrop.width <= 0 ||
      completedCrop.height <= 0
    ) {
      setCroppedFile(imageFile);
      return;
    }

    const image = imageElementRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const cropX = Math.round(completedCrop.x);
    const cropY = Math.round(completedCrop.y);
    const cropWidth = Math.round(completedCrop.width);
    const cropHeight = Math.round(completedCrop.height);

    if (cropWidth <= 0 || cropHeight <= 0) {
      setCroppedFile(imageFile);
      return;
    }

    canvas.width = cropWidth * pixelRatio;
    canvas.height = cropHeight * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const filename = imageFile?.name ?? "cropped-image.jpg";
      setCroppedFile(new File([blob], filename, { type: blob.type }));
    }, imageFile?.type ?? "image/jpeg");
  }, [completedCrop, imageFile]);

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
	const value = event.target.value;
	setDescription(value);

	if (value.length < 3) {
		setDescriptionError("Description must be at least 3 characters.");
	}else {
		setDescriptionError(null);
	}
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
	if (event.target.value.length < 3) {
		setProductNameError("Name must be at least 3 characters.");
	}else {
		setProductNameError(null);
	}
    setProductName(event.target.value);
  };

  const handleSuccessMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
	if (event.target.value.length < 3) {
		setSuccessMessageError("Success message must be at least 3 characters.");
	}else {
		setSuccessMessageError(null);
	}
    setSuccessMessage(event.target.value);
  };

  const handleGenerateSlug = () => {
    const newSlug = generateSlugValue(MAX_SLUG_LENGTH);
    setSlug(newSlug);
    setSlugError(validateSlug(newSlug, MIN_SLUG_LENGTH, MAX_SLUG_LENGTH));
  };

  const handleSlugChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeSlug(event.target.value, MAX_SLUG_LENGTH);
    setSlug(sanitized);
    setSlugError(validateSlug(sanitized, MIN_SLUG_LENGTH, MAX_SLUG_LENGTH));
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (finalImageUrl) {
      URL.revokeObjectURL(finalImageUrl);
    }
    setImageFile(file);
    setImageStage(file ? "cropping" : "idle");
    setFinalImageUrl(null);
    setCrop({ ...INITIAL_CROP });
    setCompletedCrop(null);
    setCroppedFile(file ?? null);
  };

  const handleImageLoaded = (event: React.SyntheticEvent<HTMLImageElement>) => {
    imageElementRef.current = event.currentTarget;
    setCrop({ ...INITIAL_CROP });
  };

  const handleUseCroppedImage = () => {
    const fileToUse = croppedFile ?? imageFile;
    if (!fileToUse) return;

    if (finalImageUrl) {
      URL.revokeObjectURL(finalImageUrl);
    }

    const objectUrl = URL.createObjectURL(fileToUse);
    setCroppedFile(fileToUse);
    setFinalImageUrl(objectUrl);
    setImageStage("preview");
  };

  const handleRemoveImage = () => {
    if (finalImageUrl) {
      URL.revokeObjectURL(finalImageUrl);
    }

    setFinalImageUrl(null);
    setImageFile(null);
    setCroppedFile(null);
    setCompletedCrop(null);
    setImagePreviewUrl(null);
    setCrop({ ...INITIAL_CROP });
    setImageStage("idle");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sanitizedSlug = sanitizeSlug(slug, MAX_SLUG_LENGTH);
    if (sanitizedSlug !== slug) {
      setSlug(sanitizedSlug);
    }
    const slugValidationError = validateSlug(sanitizedSlug, MIN_SLUG_LENGTH, MAX_SLUG_LENGTH);
    if (slugValidationError) {
      setSlugError(slugValidationError);
      return;
    }
    if (!Number.isFinite(amountFlow) || amountFlow <= 0) {
      setSubmitError("Amount in FLOW must be greater than zero");
      return;
    }
    const selectedImageFile = imageStage === "preview" ? croppedFile : null;
    let imageBase64: string | null = null;
    if (selectedImageFile) {
      imageBase64 = await fileToBase64(selectedImageFile);
    }
    setSlugError(null);
    setSubmitError(null);

    try {
      setSubmitting(true);
      await onCreate({
        name: productName,
        description,
        amountFlow,
        successMessage,
        redirectUrl: redirectLink || undefined,
        slug: sanitizedSlug,
        imageBase64,
      });
      onClose();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error ?? "Failed to create payment link. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed h-screen inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[90%] overflow-y-auto  max-w-2xl rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Create Payment Link</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 transition hover:text-gray-700"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Image of Product/Service (Optional)
            </label>
            {imageStage === "idle" ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className="mt-2 flex h-40 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-500 transition hover:border-green-500 hover:text-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                <span>Click to upload image</span>
              </div>
            ) : null}
            {imageStage === "cropping" ? (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-green-600 transition hover:text-green-700"
                >
                  Choose different image
                </button>
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelection}
              className="hidden"
            />
            {imageStage === "cropping" && imagePreviewUrl ? (
              <>
                <div className="mt-3 max-h-72 w-full overflow-auto rounded-md border border-gray-200 bg-white p-2">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(_, percentCrop) => {
                      if (!imageElementRef.current) {
                        setCompletedCrop(null);
                        return;
                      }
                      const pixelCrop = convertToPixelCrop(
                        percentCrop,
                        imageElementRef.current.naturalWidth,
                        imageElementRef.current.naturalHeight
                      );
                      if (pixelCrop.width && pixelCrop.height) {
                        setCompletedCrop(pixelCrop);
                      } else {
                        setCompletedCrop(null);
                      }
                    }}
                    keepSelection
                  >
                    <img
                      ref={imageElementRef}
                      src={imagePreviewUrl}
                      alt="Selected product"
                      onLoad={handleImageLoaded}
                      className="block max-w-none"
                    />
                  </ReactCrop>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleUseCroppedImage}
                    disabled={!croppedFile}
                    className="rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300"
                  >
                    Use image
                  </button>
                </div>
              </>
            ) : null}
            {imageStage === "preview" && finalImageUrl ? (
              <div className="group relative mt-3 max-h-72 w-max mx-auto overflow-auto rounded-md border border-gray-200 bg-white p-2">
                <img
                  src={finalImageUrl}
                  alt="Selected product preview"
                  className="block max-w-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute right-3 top-3 flex rounded-md bg-white/90 px-3 py-1 text-sm font-semibold text-red-600 opacity-0 shadow transition hover:bg-white focus-visible:opacity-100 focus-visible:pointer-events-auto group-hover:pointer-events-auto group-hover:opacity-100 pointer-events-none"
                >
                  Remove image
                </button>
              </div>
            ) : null}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Name of Product/Service
              </label>
              <span className="text-xs text-gray-500">{productNameWordCount}/{MAX_NAME_LENGTH} chars</span>
            </div>
            <input
              type="text"
			  minLength={3}
			  maxLength={MAX_NAME_LENGTH}	
              required
              value={productName}
              onChange={handleNameChange}
              className="mt-2 block w-full rounded-md border border-gray-300 p-2"
            />
			{productNameError ? (
              <p className="mt-1 text-xs text-red-600">{productNameError}</p>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Description (Optional, up to 255 words)
              </label>
              <span className="text-xs text-gray-500">{wordCount}/{MAX_DESCRIPTION_LENGTH} chars</span>
            </div>
            <textarea
				minLength={3}
				maxLength={MAX_DESCRIPTION_LENGTH}
              value={description}
              onChange={handleDescriptionChange}
              rows={4}
              className="mt-2 block w-full rounded-md border border-gray-300 p-2"
              placeholder="Describe the product or service..."
            />
			{descriptionError ? (
              <p className="mt-1 text-xs text-red-600">{descriptionError}</p>
            ) : null}
          </div>
			<div>
				<div className="flex items-center justify-between">
					<label className="block text-sm font-medium text-gray-700">
					Amount Flow
					</label>
				</div>
				<input
				type="number"
				min={1}
				required
				placeholder="Enter amount flow"
				value={amountFlow}
				onChange={(e) => setAmountFlow(Number(e.target.value))}
				className="mt-2 block w-full rounded-md border border-gray-300 p-2"
				/>
			</div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Custom Success Message (Optional)
              </label>
              <span className="text-xs text-gray-500">
                {successWordCount}/{MAX_SUCCESS_MESSAGE_LENGTH} chars
              </span>
            </div>
            <input
              type="text"
			  minLength={3}
			  maxLength={MAX_SUCCESS_MESSAGE_LENGTH}
              value={successMessage}
              onChange={handleSuccessMessageChange}
              className="mt-2 block w-full rounded-md border border-gray-300 p-2"
              placeholder="Thank you"
            />
			{successMessageError ? (
              <p className="mt-1 text-xs text-red-600">{successMessageError}</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Link
            </label>
            <div className="mt-2 flex">
              <span className="flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-3 text-sm text-gray-600">
                {BASE_PAYMENT_PATH}
              </span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                className={`flex-1 rounded-none border p-2 focus:outline-none focus:ring-2 ${slugError ? "border-red-500 focus:border-red-500 focus:ring-red-500/40" : "border-gray-300 focus:border-green-500 focus:ring-green-500/40"}`}
                minLength={MIN_SLUG_LENGTH}
                maxLength={MAX_SLUG_LENGTH}
                aria-invalid={Boolean(slugError)}
                autoComplete="off"
                placeholder="custom-link"
              />
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="rounded-r-md border border-l-0 border-gray-300 px-4 text-gray-600 transition hover:bg-gray-100"
                aria-label="Generate link"
              >
                <FaSync />
              </button>
            </div>
            {slugError ? (
              <p className="mt-1 text-xs text-red-600">{slugError}</p>
            ) : null}
            <p className="mt-1 text-xs text-gray-500">
              Users will be directed to {BASE_PAYMENT_PATH}
              {slug || "<your-link>"}.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Redirect Link (Optional)
            </label>
            <input
              type="url"
              value={redirectLink}
              onChange={(event) => setRedirectLink(event.target.value)}
              className="mt-2 block w-full rounded-md border border-gray-300 p-2"
              placeholder="https://example.com/thank-you"
            />
          </div>

          {submitError ? (
            <p className="text-sm text-red-600">{submitError}</p>
          ) : null}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(slugError) || submitting}
              className={`rounded-md px-4 py-2 font-semibold text-white transition ${
                slugError || submitting ? "cursor-not-allowed bg-green-300" : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {submitting ? "Saving..." : "Save Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentLinkModal;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("File read error"));
    reader.readAsDataURL(file);
  });
}
