import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import type {MouseEvent, SyntheticEvent} from 'react';

import {

  AlertCircle,

  ArrowRight,

  CheckCircle2,

  ChevronLeft,

  ChevronRight,

  Clock,

  Heart,

  PackageCheck,

  ShieldCheck,

  ShoppingCart,

  Sparkles,

  Truck,

  UserCircle,

} from 'lucide-react';

import {Button} from './ui/button';

import {addToCart, createCart, getProductByHandle} from '../../lib/shopify';

import {getShippingLabel} from '../../lib/shipping';

import {ProductDescription} from './ProductDescription';

import {RelatedProducts} from './RelatedProducts';

import {

  trackAddToCart,

  trackBeginCheckout,

  trackViewItem,

} from '../../lib/analytics';



const LOCAL_DELIVERY_ZIPS = [

  '92399',

  '92320',

  '92373',

  '92374',

  '92223',

  '92555',

  '92557',

];



const authLoginUrl = 'https://www.ildistributions.com/api/auth/login';

const wishlistLoginMessage =

  'To add this product to your wishlist, sign in or create an account using the account icon in the top-right corner.';



const productBenefits = [

  {icon: Truck, label: 'Fast Shipping'},

  {icon: ShieldCheck, label: 'Secure Checkout'},

  {icon: PackageCheck, label: 'Quality Products'},

];



function getOptimizedProductImage(url = '', width = 1200) {

  if (!url) return '';



  try {

    const imageUrl = new URL(url);

    if (imageUrl.hostname.includes('cdn.shopify.com')) {

      imageUrl.searchParams.set('width', String(width));

    }

    return imageUrl.toString();

  } catch {

    return url;

  }

}



function normalizeLookupValue(value: unknown) {

  return typeof value === 'string' ? value.trim().toLowerCase() : '';

}



function getVariantSelection(variant: any) {

  const selection: Record<string, string> = {};



  for (const option of variant?.selectedOptions || []) {

    if (!option?.name) continue;

    selection[option.name] = option.value || '';

  }



  return selection;

}



function isDefaultShopifyOption(option: any) {

  if (!option) return true;

  const values = Array.isArray(option.values) ? option.values : [];

  return (

    normalizeLookupValue(option.name) === 'title' &&

    values.length === 1 &&

    normalizeLookupValue(values[0]) === 'default title'

  );

}



async function readJsonResponse(response: Response) {

  const responseText = await response.text();

  if (!responseText.trim()) return null;



  try {

    return JSON.parse(responseText);

  } catch {

    return null;

  }

}



function getDeliveryEstimate(tags: unknown[]) {

  for (const tag of tags) {

    if (typeof tag !== 'string') continue;



    const match = tag.trim().match(/^delivery_(\d{1,2})_(\d{1,2})$/i);

    if (!match) continue;



    const minimumDays = Number(match[1]);

    const maximumDays = Number(match[2]);



    if (

      minimumDays < 1 ||

      maximumDays < minimumDays ||

      maximumDays > 60

    ) {

      continue;

    }



    return `${minimumDays}–${maximumDays} business ${

      maximumDays === 1 ? 'day' : 'days'

    }`;

  }



  return '';

}



function getAnalyticsItem(product: any, variant: any, quantity = 1) {

  const itemPrice = Number(

    variant?.price?.amount || product?.priceRange?.minVariantPrice?.amount || 0

  );

  const brandTag = product?.tags?.find((tag: string) =>

    tag.startsWith('brand_')

  );

  const categoryTag = product?.tags?.find((tag: string) =>

    tag.startsWith('category_')

  );



  return {

    item_id: variant?.id || product?.id || product?.handle,

    item_name: product?.title,

    item_brand: brandTag

      ? brandTag.replace('brand_', '').replaceAll('-', ' ')

      : 'IL Distributions',

    item_category: categoryTag

      ? categoryTag.replace('category_', '').replaceAll('-', ' ')

      : undefined,

    item_variant: variant?.title || undefined,

    price: itemPrice,

    quantity,

  };

}



async function saveCustomerCart(cart: any) {

  if (!cart?.id) return;



  try {

    await fetch('/api/cart/save', {

      method: 'POST',

      headers: {'Content-Type': 'application/json'},

      body: JSON.stringify({cart_id: cart.id, cart_data: cart}),

    });

  } catch {

    console.warn('Cart could not be synced.');

  }

}



type ImagePresentation = {
  backgroundColor: string;
  isWhiteBackground: boolean;
};

const DEFAULT_IMAGE_PRESENTATION: ImagePresentation = {
  backgroundColor: '#FFFFFF',
  isWhiteBackground: true,
};

const imagePresentationCache = new Map<string, ImagePresentation>();

function analyzeImagePresentation(url: string): Promise<ImagePresentation> {
  const cached = imagePresentationCache.get(url);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    if (!url || typeof document === 'undefined') {
      resolve(DEFAULT_IMAGE_PRESENTATION);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';

    image.onload = () => {
      try {
        const sampleSize = 32;
        const borderWidth = 3;
        const canvas = document.createElement('canvas');
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        const context = canvas.getContext('2d', {willReadFrequently: true});
        if (!context) {
          resolve(DEFAULT_IMAGE_PRESENTATION);
          return;
        }

        context.drawImage(image, 0, 0, sampleSize, sampleSize);
        const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;

        let total = 0;
        let whitePixels = 0;
        let red = 0;
        let green = 0;
        let blue = 0;

        for (let y = 0; y < sampleSize; y += 1) {
          for (let x = 0; x < sampleSize; x += 1) {
            const isBorder =
              x < borderWidth ||
              y < borderWidth ||
              x >= sampleSize - borderWidth ||
              y >= sampleSize - borderWidth;

            if (!isBorder) continue;

            const offset = (y * sampleSize + x) * 4;
            const alpha = pixels[offset + 3];
            if (alpha < 24) continue;

            const r = pixels[offset];
            const g = pixels[offset + 1];
            const b = pixels[offset + 2];

            total += 1;
            red += r;
            green += g;
            blue += b;

            const channelSpread = Math.max(r, g, b) - Math.min(r, g, b);
            if (r >= 242 && g >= 242 && b >= 242 && channelSpread <= 18) {
              whitePixels += 1;
            }
          }
        }

        if (!total) {
          imagePresentationCache.set(url, DEFAULT_IMAGE_PRESENTATION);
          resolve(DEFAULT_IMAGE_PRESENTATION);
          return;
        }

        const whiteRatio = whitePixels / total;
        const isWhiteBackground = whiteRatio >= 0.82;

        const presentation: ImagePresentation = isWhiteBackground
          ? DEFAULT_IMAGE_PRESENTATION
          : {
              isWhiteBackground: false,
              backgroundColor: `rgb(${Math.round(red / total)}, ${Math.round(
                green / total,
              )}, ${Math.round(blue / total)})`,
            };

        imagePresentationCache.set(url, presentation);
        resolve(presentation);
      } catch {
        imagePresentationCache.set(url, DEFAULT_IMAGE_PRESENTATION);
        resolve(DEFAULT_IMAGE_PRESENTATION);
      }
    };

    image.onerror = () => {
      imagePresentationCache.set(url, DEFAULT_IMAGE_PRESENTATION);
      resolve(DEFAULT_IMAGE_PRESENTATION);
    };

    // Analyze a tiny Shopify CDN rendition instead of the full-size image.
    image.src = getOptimizedProductImage(url, 64);
  });
}


const ProductGallery = memo(function ProductGallery({
  product,
  selectedVariant,
  variantImageRequest,
  isOutOfStock,
  onImageSelected,
  onPrimaryImageReady,
}: {
  product: any;
  selectedVariant: any;
  variantImageRequest: number;
  isOutOfStock: boolean;
  onImageSelected: (image: any) => void;
  onPrimaryImageReady: () => void;
}) {
  const images = useMemo(
    () => product.images?.edges?.map((item: any) => item.node).filter(Boolean) || [],
    [product.images?.edges],
  );

  const firstImage =
    product.displayImage?.url ||
    product.featuredImage?.url ||
    images[0]?.url ||
    '';

  const [selectedImage, setSelectedImage] = useState(firstImage);
  const [imagePresentation, setImagePresentation] = useState<ImagePresentation>(
    DEFAULT_IMAGE_PRESENTATION,
  );
  const thumbnailStripRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef(new Map<string, HTMLButtonElement>());
  const mainImageRef = useRef<HTMLImageElement>(null);
  const mainImage = selectedImage || firstImage;

  const currentImageIndex = useMemo(() => {
    if (!mainImage || !images.length) return -1;
    return images.findIndex((image: any) => image?.url === mainImage);
  }, [images, mainImage]);

  useEffect(() => {
    setSelectedImage(firstImage);
  }, [firstImage, product.id]);

  // This effect only reacts to an explicit variant-button selection.
  // Image -> variant changes intentionally do not increment variantImageRequest,
  // so a customer can keep viewing the exact image they clicked.
  useEffect(() => {
    if (!variantImageRequest) return;
    const variantImageUrl = selectedVariant?.image?.url;
    if (variantImageUrl) setSelectedImage(variantImageUrl);
    // variantImageRequest is deliberately the only trigger for this behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantImageRequest]);

  // Whenever the active image changes (including a variant change), center its
  // thumbnail in the horizontal strip without moving the page vertically.
  useEffect(() => {
    if (!selectedImage) return;

    const strip = thumbnailStripRef.current;
    const thumbnail = thumbnailRefs.current.get(selectedImage);
    if (!strip || !thumbnail) return;

    const frame = window.requestAnimationFrame(() => {
      const targetLeft =
        thumbnail.offsetLeft - strip.clientWidth / 2 + thumbnail.clientWidth / 2;

      strip.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedImage]);

  // Analyze only the currently displayed image, using a 64px CDN rendition.
  // Results are cached at module level, so revisiting an image costs nothing.
  useEffect(() => {
    let active = true;

    if (!mainImage) {
      setImagePresentation(DEFAULT_IMAGE_PRESENTATION);
      return undefined;
    }

    const cached = imagePresentationCache.get(mainImage);
    if (cached) {
      setImagePresentation(cached);
      return undefined;
    }

    setImagePresentation(DEFAULT_IMAGE_PRESENTATION);

    void analyzeImagePresentation(mainImage).then((presentation) => {
      if (active) setImagePresentation(presentation);
    });

    return () => {
      active = false;
    };
  }, [mainImage]);

  const scrollThumbnails = useCallback((direction: 'left' | 'right') => {
    const strip = thumbnailStripRef.current;
    if (!strip) return;

    const distance = Math.max(strip.clientWidth * 0.75, 240);
    strip.scrollBy({
      left: direction === 'right' ? distance : -distance,
      behavior: 'smooth',
    });
  }, []);

  const handleImageSelection = useCallback(
    (image: any) => {
      if (!image?.url) return;
      setSelectedImage(image.url);
      onImageSelected(image);
    },
    [onImageSelected],
  );

  const showAdjacentImage = useCallback(
    (direction: 'previous' | 'next') => {
      if (images.length < 2) return;

      const baseIndex = currentImageIndex >= 0 ? currentImageIndex : 0;
      const nextIndex =
        direction === 'next'
          ? (baseIndex + 1) % images.length
          : (baseIndex - 1 + images.length) % images.length;

      handleImageSelection(images[nextIndex]);
    },
    [currentImageIndex, handleImageSelection, images],
  );

  const canUseHoverZoom = useCallback(() => {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
  }, []);

  const handleZoomEnter = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      if (!canUseHoverZoom()) return;

      const image = event.currentTarget;
      image.style.willChange = 'transform';
      image.style.transform = 'scale(1.65)';
      image.style.cursor = 'zoom-in';
    },
    [canUseHoverZoom],
  );

  const handleZoomMove = useCallback(
    (event: MouseEvent<HTMLImageElement>) => {
      if (!canUseHoverZoom()) return;

      const image = event.currentTarget;
      const bounds = image.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;

      image.style.transformOrigin = `${Math.min(100, Math.max(0, x))}% ${Math.min(
        100,
        Math.max(0, y),
      )}%`;
    },
    [canUseHoverZoom],
  );

  const handleZoomLeave = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      image.style.transform = 'scale(1)';
      image.style.transformOrigin = 'center center';
      image.style.willChange = 'auto';
      image.style.cursor = 'default';
    },
    [],
  );

  const handlePrimaryImageLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;

      if (typeof image.decode !== 'function') {
        onPrimaryImageReady();
        return;
      }

      void image
        .decode()
        .catch(() => undefined)
        .finally(onPrimaryImageReady);
    },
    [onPrimaryImageReady],
  );

  return (
    <div>
      <div
        className="group relative overflow-hidden rounded-[2rem] border border-[#D8DDD8] p-4 shadow-[0_12px_32px_rgba(17,17,17,0.07)] transition-[background-color] duration-200 md:p-8"
        style={{backgroundColor: imagePresentation.backgroundColor}}
      >
        {isOutOfStock && (
          <div className="absolute left-6 right-6 top-6 z-30 rounded-full bg-[#111111] px-5 py-3 text-center text-xs font-extrabold uppercase tracking-[0.22em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
            Out of Stock
          </div>
        )}

        {mainImage ? (
          <>
            <img
              ref={mainImageRef}
              src={getOptimizedProductImage(mainImage, 1200)}
              alt={product.title}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              width="1200"
              height="1200"
              onLoad={handlePrimaryImageLoad}
              onError={onPrimaryImageReady}
              onMouseEnter={handleZoomEnter}
              onMouseMove={handleZoomMove}
              onMouseLeave={handleZoomLeave}
              className={`relative z-10 h-[320px] w-full object-contain transition-transform duration-150 ease-out sm:h-[430px] lg:h-[560px] ${
                isOutOfStock ? 'opacity-70 grayscale' : ''
              }`}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => showAdjacentImage('previous')}
                  aria-label="Show previous product image"
                  className="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#0F5A46] opacity-90 shadow-lg backdrop-blur transition-[opacity,transform,background-color] hover:scale-105 hover:bg-white focus-visible:opacity-100 md:left-6 lg:opacity-0 lg:group-hover:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => showAdjacentImage('next')}
                  aria-label="Show next product image"
                  className="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#0F5A46] opacity-90 shadow-lg backdrop-blur transition-[opacity,transform,background-color] hover:scale-105 hover:bg-white focus-visible:opacity-100 md:right-6 lg:opacity-0 lg:group-hover:opacity-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="absolute bottom-4 right-4 z-30 rounded-full bg-[#111111]/70 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur md:bottom-6 md:right-6">
                  {currentImageIndex >= 0 ? currentImageIndex + 1 : 1} / {images.length}
                </div>

                <div className="pointer-events-none absolute bottom-4 left-4 z-30 hidden items-center gap-2 rounded-full bg-[#111111]/65 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-sm backdrop-blur transition-opacity lg:flex lg:group-hover:opacity-100 md:bottom-6 md:left-6">
                  Hover to zoom
                </div>
              </>
            )}
          </>
        ) : (
          <div className="relative z-10 flex h-[320px] items-center justify-center text-[#717182] sm:h-[430px] lg:h-[560px]">
            No image
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="relative mt-5">
          <button
            type="button"
            onClick={() => scrollThumbnails('left')}
            aria-label="Scroll product images left"
            className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#D8DDD8] bg-white/95 text-[#0F5A46] shadow-md backdrop-blur transition hover:border-[#0F5A46]/40 hover:bg-[#F7FAF8]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={thumbnailStripRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-14 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((image: any, index: number) => {
              const isSelected = selectedImage === image.url;

              return (
                <button
                  key={image.id || image.url || index}
                  ref={(node) => {
                    if (node && image.url) thumbnailRefs.current.set(image.url, node);
                    else if (image.url) thumbnailRefs.current.delete(image.url);
                  }}
                  type="button"
                  onClick={() => handleImageSelection(image)}
                  aria-label={`Show image ${index + 1} of ${product.title}`}
                  aria-pressed={isSelected}
                  className={`min-w-[88px] snap-start rounded-2xl border bg-white p-2 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 md:min-w-[104px] md:p-3 ${
                    isSelected
                      ? 'border-[#0F5A46] ring-2 ring-[#0F5A46]/10'
                      : 'border-[#D8DDD8] hover:border-[#0F5A46]/40'
                  }`}
                >
                  <img
                    src={getOptimizedProductImage(image.url, 220)}
                    alt={image.altText || `${product.title} image ${index + 1}`}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority="low"
                    width="220"
                    height="220"
                    className={`h-20 w-full object-contain md:h-24 ${
                      isOutOfStock ? 'opacity-70 grayscale' : ''
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollThumbnails('right')}
            aria-label="Scroll product images right"
            className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#D8DDD8] bg-white/95 text-[#0F5A46] shadow-md backdrop-blur transition hover:border-[#0F5A46]/40 hover:bg-[#F7FAF8]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
});


const BenefitCard = memo(function BenefitCard({

  icon: Icon,

  label,

}: (typeof productBenefits)[number]) {

  return (

    <div className="rounded-2xl border border-[#D8DDD8] bg-[#F8F7F3] p-4">

      <Icon className="mb-3 h-6 w-6 text-[#0F5A46]" />

      <p className="text-sm font-bold text-[#111111]">{label}</p>

    </div>

  );

});



const MemoizedProductDescription = memo(ProductDescription);

const MemoizedRelatedProducts = memo(RelatedProducts);



export function ProductPage({

  handle,

  onPageReady,

}: {

  handle: string;

  onPageReady?: () => void;

}) {

  const [product, setProduct] = useState<any>(null);

  // Keep the browser tab title (and Google Analytics page_title) in sync with
  // the product's SEO title when navigating inside the app.
  useEffect(() => {
    if (!product) return;
    const previousTitle = document.title;
    document.title = product.seo?.title || `${product.title} | ILD`;
    const description = product.seo?.description;
    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.getAttribute('content') || '';
    if (description && descriptionTag) {
      descriptionTag.setAttribute('content', description);
    }
    return () => {
      document.title = previousTitle;
      if (description && descriptionTag) {
        descriptionTag.setAttribute('content', previousDescription);
      }
    };
  }, [product]);

  const [selectedVariantId, setSelectedVariantId] = useState('');

  const [variantImageRequest, setVariantImageRequest] = useState(0);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState(false);

  const [adding, setAdding] = useState(false);

  const [buying, setBuying] = useState(false);

  const [addedMessage, setAddedMessage] = useState('');

  const [actionError, setActionError] = useState('');

  const [wishlistMessage, setWishlistMessage] = useState('');

  const [wishlistAccessMessage, setWishlistAccessMessage] = useState('');

  const [isWishlisted, setIsWishlisted] = useState(false);

  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [primaryImageReady, setPrimaryImageReady] = useState(false);

  const readyWasAnnouncedRef = useRef(false);



  const handlePrimaryImageReady = useCallback(() => {

    setPrimaryImageReady(true);

  }, []);



  useEffect(() => {

    let active = true;

    setLoading(true);

    setLoadError(false);

    setProduct(null);

    setSelectedVariantId('');

    setVariantImageRequest(0);

    setPrimaryImageReady(false);

    readyWasAnnouncedRef.current = false;



    async function loadProduct() {

      try {

        const data = await getProductByHandle(handle);

        if (!active) return;



        const initialVariant =

          data?.selectedVariant ||

          data?.displayVariant ||

          data?.variants?.find((variant: any) => !variant.isOutOfStock) ||

          data?.variants?.[0] ||

          null;



        setProduct(data || null);

        setSelectedVariantId(initialVariant?.id || '');

        setLoadError(!data);

        setAddedMessage('');

        setActionError('');

        setWishlistMessage('');

        setWishlistAccessMessage('');

        setIsWishlisted(false);

      } catch {

        if (active) {

          setProduct(null);

          setSelectedVariantId('');

          setLoadError(true);

        }

      } finally {

        if (active) setLoading(false);

      }

    }



    void loadProduct();



    return () => {

      active = false;

    };

  }, [handle]);



  const variants = useMemo(

    () => (Array.isArray(product?.variants) ? product.variants : []),

    [product?.variants]

  );



  const variantIndex = useMemo(() => {

    const byId = new Map<string, any>();

    const optionNames = (product?.options || [])

      .filter((option: any) => option?.name)

      .map((option: any) => option.name as string);

    const bySignature = new Map<string, any>();

    const byHint = new Map<string, any[]>();

    const selectionsById = new Map<string, Record<string, string>>();



    const makeSignature = (selection: Record<string, string>) =>

      optionNames

        .map((name: string) => `${name}=${selection[name] || ''}`)

        .join('\u001f');



    const addHint = (hint: unknown, variant: any) => {

      const key = normalizeLookupValue(hint);

      if (!key) return;

      const existing = byHint.get(key);

      if (existing) existing.push(variant);

      else byHint.set(key, [variant]);

    };



    for (const variant of variants) {

      if (!variant?.id) continue;

      byId.set(variant.id, variant);



      const selection = getVariantSelection(variant);

      selectionsById.set(variant.id, selection);

      bySignature.set(makeSignature(selection), variant);



      addHint(variant.title, variant);

      for (const option of variant.selectedOptions || []) {

        addHint(option?.value, variant);

      }

    }



    return {

      byId,

      bySignature,

      byHint,

      optionNames,

      selectionsById,

      makeSignature,

    };

  }, [product?.options, variants]);



  const selectedVariant = useMemo(() => {

    return (

      variantIndex.byId.get(selectedVariantId) ||

      product?.selectedVariant ||

      product?.displayVariant ||

      variants.find((variant: any) => !variant.isOutOfStock) ||

      variants[0] ||

      null

    );

  }, [product, selectedVariantId, variantIndex.byId, variants]);



  const selectedOptions = useMemo(

    () =>

      selectedVariant?.id

        ? variantIndex.selectionsById.get(selectedVariant.id) ||

          getVariantSelection(selectedVariant)

        : {},

    [selectedVariant, variantIndex.selectionsById]

  );



  const visibleOptions = useMemo(

    () =>

      (product?.options || []).filter(

        (option: any) =>

          option?.name &&

          Array.isArray(option.values) &&

          option.values.length > 0 &&

          !isDefaultShopifyOption(option)

      ),

    [product?.options]

  );



  const resolveVariantForOption = useCallback(

    (optionName: string, optionValue: string) => {

      const nextSelection = {...selectedOptions, [optionName]: optionValue};

      return variantIndex.bySignature.get(

        variantIndex.makeSignature(nextSelection)

      );

    },

    [selectedOptions, variantIndex]

  );



  const selectVariantFromOption = useCallback((variant: any) => {

    if (!variant?.id || variant.isOutOfStock || !variant.availableForSale) return;



    setSelectedVariantId(variant.id);

    setVariantImageRequest((request) => request + 1);

    setAddedMessage('');

    setActionError('');

  }, []);



  const resolveVariantFromImage = useCallback(

    (image: any) => {

      if (!image) return null;



      const directVariantId =

        product?.imageVariantMap?.[image.id] ||

        product?.imageVariantMap?.[image.url] ||

        '';



      if (directVariantId) {

        return variantIndex.byId.get(directVariantId) || null;

      }



      const hintKey = normalizeLookupValue(image.variantHint);

      if (!hintKey) return null;



      const candidates = variantIndex.byHint.get(hintKey) || [];

      if (!candidates.length) return null;

      if (candidates.length === 1) return candidates[0];



      // If an image hint identifies one option (for example "Red"), keep the

      // currently selected values for the other options whenever possible.

      let bestVariant: any = null;

      let bestScore = -1;



      for (const candidate of candidates) {

        const candidateSelection =

          variantIndex.selectionsById.get(candidate.id) ||

          getVariantSelection(candidate);

        let score = candidate.isOutOfStock || !candidate.availableForSale ? -100 : 0;



        for (const [name, value] of Object.entries(selectedOptions)) {

          if (candidateSelection[name] === value) score += 1;

        }



        if (score > bestScore) {

          bestScore = score;

          bestVariant = candidate;

        }

      }



      return bestVariant;

    },

    [product?.imageVariantMap, selectedOptions, variantIndex]

  );



  const handleGalleryImageSelected = useCallback(

    (image: any) => {

      const imageVariant = resolveVariantFromImage(image);



      // Customers can still inspect images of a sold-out variant, but viewing

      // that image does not replace an available purchasing selection.

      if (

        !imageVariant?.id ||

        imageVariant.isOutOfStock ||

        !imageVariant.availableForSale ||

        imageVariant.id === selectedVariant?.id

      ) {

        return;

      }



      setSelectedVariantId(imageVariant.id);

      setAddedMessage('');

      setActionError('');

    },

    [resolveVariantFromImage, selectedVariant?.id]

  );



  const primaryImageUrl =

    product?.displayImage?.url ||

    product?.featuredImage?.url ||

    product?.images?.edges?.[0]?.node?.url ||

    '';



  useEffect(() => {

    if (loading || readyWasAnnouncedRef.current) return;



    const contentIsReady =

      loadError || (product && (!primaryImageUrl || primaryImageReady));

    if (!contentIsReady) return;



    let secondFrame = 0;

    const firstFrame = window.requestAnimationFrame(() => {

      secondFrame = window.requestAnimationFrame(() => {

        if (readyWasAnnouncedRef.current) return;

        readyWasAnnouncedRef.current = true;

        onPageReady?.();

      });

    });



    return () => {

      window.cancelAnimationFrame(firstFrame);

      if (secondFrame) window.cancelAnimationFrame(secondFrame);

    };

  }, [

    loadError,

    loading,

    onPageReady,

    primaryImageReady,

    primaryImageUrl,

    product,

  ]);



  useEffect(() => {

    if (!product?.id) return;

    const controller = new AbortController();



    async function loadWishlistStatus() {

      try {

        const response = await fetch('/api/wishlist/list', {

          signal: controller.signal,

          headers: {Accept: 'application/json'},

        });



        if (response.status === 401 || response.status === 403) {

          setIsWishlisted(false);

          return;

        }



        if (!response.ok) return;

        const data = await readJsonResponse(response);



        if (

          !controller.signal.aborted &&

          data?.success &&

          Array.isArray(data.items)

        ) {

          setIsWishlisted(

            data.items.some((item: any) => item.product_id === product.id)

          );

        }

      } catch {

        if (!controller.signal.aborted) setIsWishlisted(false);

      }

    }



    void loadWishlistStatus();

    return () => controller.abort();

  }, [product?.id]);



  useEffect(() => {

    if (!product?.id) return;



    const initialVariant =

      product.selectedVariant ||

      product.displayVariant ||

      variants.find((variant: any) => !variant.isOutOfStock) ||

      variants[0] ||

      null;

    const currency =

      initialVariant?.price?.currencyCode ||

      product?.priceRange?.minVariantPrice?.currencyCode ||

      'USD';



    trackViewItem(getAnalyticsItem(product, initialVariant, 1), currency);

  }, [product?.id]); // View-item is intentionally recorded once per product load.



  async function handleWishlistToggle() {

    if (!product || wishlistLoading) return;



    setWishlistLoading(true);

    setWishlistMessage('');

    setWishlistAccessMessage('');

    setActionError('');



    try {

      const customerResponse = await fetch('/api/customer/me', {

        headers: {Accept: 'application/json'},

      });

      const customerData = await readJsonResponse(customerResponse);

      const isSignedOut =

        customerResponse.status === 401 ||

        customerResponse.status === 403 ||

        (customerResponse.ok && customerData?.isLoggedIn !== true);



      if (isSignedOut) {

        setIsWishlisted(false);

        setWishlistAccessMessage(wishlistLoginMessage);

        return;

      }



      if (!customerResponse.ok || !customerData) {

        throw new Error(

          'To save products to your wishlist, first sign in or create an account using the account icon in the top-right corner.'

        );

      }



      const response = isWishlisted

        ? await fetch('/api/wishlist/remove', {

            method: 'DELETE',

            headers: {'Content-Type': 'application/json'},

            body: JSON.stringify({product_id: product.id}),

          })

        : await fetch('/api/wishlist/add', {

            method: 'POST',

            headers: {'Content-Type': 'application/json'},

            body: JSON.stringify({

              product_id: product.id,

              variant_id: selectedVariant?.id || null,

              handle: product.handle,

              title: product.title,

              image_url:

                selectedVariant?.image?.url ||

                product.displayImage?.url ||

                product.featuredImage?.url ||

                null,

              price:

                selectedVariant?.price?.amount ||

                product.priceRange?.minVariantPrice?.amount ||

                null,

            }),

          });



      if (response.status === 401 || response.status === 403) {

        setIsWishlisted(false);

        setWishlistAccessMessage(wishlistLoginMessage);

        return;

      }



      const data = await readJsonResponse(response);

      if (!response.ok || !data?.success) {

        throw new Error(

          data?.error ||

            'The wishlist service did not return a valid response. Please try again.'

        );

      }



      const nextWishlisted = !isWishlisted;

      setIsWishlisted(nextWishlisted);

      setWishlistMessage(

        nextWishlisted ? 'Added to wishlist.' : 'Removed from wishlist.'

      );

    } catch (error) {

      setActionError(

        error instanceof Error ? error.message : 'Unable to update wishlist.'

      );

    } finally {

      setWishlistLoading(false);

    }

  }



  const isSelectedVariantOutOfStock =

    !selectedVariant ||

    selectedVariant.isOutOfStock ||

    !selectedVariant.availableForSale;



  async function handleAddToCart() {

    if (!product || adding || isSelectedVariantOutOfStock) return;



    const variantId = selectedVariant?.id || '';

    if (!variantId) return;



    const currency =

      selectedVariant?.price?.currencyCode ||

      product?.priceRange?.minVariantPrice?.currencyCode ||

      'USD';



    setAdding(true);

    setAddedMessage('');

    setActionError('');



    try {

      const currentCartId = localStorage.getItem('shopify_cart_id');

      let updatedCart = currentCartId

        ? await addToCart(currentCartId, variantId, 1)

        : await createCart(variantId, 1);



      if (!updatedCart || updatedCart.error) {

        if (currentCartId) {

          localStorage.removeItem('shopify_cart_id');

          updatedCart = await createCart(variantId, 1);

        }



        if (!updatedCart || updatedCart.error) {

          throw new Error(updatedCart?.message || 'Unable to add to cart.');

        }

      }



      localStorage.setItem('shopify_cart_id', updatedCart.id);

      localStorage.setItem(

        'shopify_cart_quantity',

        String(updatedCart.totalQuantity || 1)

      );

      window.dispatchEvent(new Event('cartUpdated'));

      trackAddToCart(getAnalyticsItem(product, selectedVariant, 1), currency);

      setAddedMessage('Product added to cart.');

      void saveCustomerCart(updatedCart);

    } catch (error) {

      console.error(error);

      setActionError(

        error instanceof Error ? error.message : 'Something went wrong.'

      );

    } finally {

      setAdding(false);

    }

  }



  async function handleBuyNow() {

    if (!product || buying || isSelectedVariantOutOfStock) return;



    const variantId = selectedVariant?.id || '';

    if (!variantId) return;



    const currency =

      selectedVariant?.price?.currencyCode ||

      product?.priceRange?.minVariantPrice?.currencyCode ||

      'USD';

    const item = getAnalyticsItem(product, selectedVariant, 1);



    setBuying(true);

    setActionError('');



    try {

      const cart = await createCart(variantId, 1);



      if (!cart || cart.error) {

        throw new Error(cart?.message || 'Unable to start checkout.');

      }

      if (!cart.checkoutUrl) throw new Error('Unable to start checkout.');



      trackBeginCheckout([item], Number(item.price || 0), currency);

      window.setTimeout(() => {

        window.location.href = cart.checkoutUrl;

      }, 250);

    } catch (error) {

      setActionError(

        error instanceof Error ? error.message : 'Unable to start checkout.'

      );

    } finally {

      setBuying(false);

    }

  }



  if (loading || !product) {

    return (

      <section className="min-h-[500px] bg-[#F1F1EC] px-4 py-20">

        <div className="container mx-auto">

          <div className="rounded-3xl border border-[#D8DDD8] bg-white p-10 text-center shadow-sm">

            <p

              className={

                loadError ? 'font-semibold text-[#A13D32]' : 'text-[#717182]'

              }

            >

              {loadError

                ? 'This product could not be loaded.'

                : 'Loading product...'}

            </p>

          </div>

        </div>

      </section>

    );

  }



  const price = Number(

    selectedVariant?.price?.amount ||

      product.displayPrice?.amount ||

      product.priceRange?.minVariantPrice?.amount ||

      0

  );

  const compareAtPrice = Number(

    selectedVariant?.compareAtPrice?.amount ||

      product.displayCompareAtPrice?.amount ||

      product.compareAtPriceRange?.minVariantPrice?.amount ||

      0

  );

  const hasCompareAtPrice = compareAtPrice > price;

  const discountPercent = hasCompareAtPrice

    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)

    : 0;

  const shippingLabel = getShippingLabel(product);

  const tags = product.tags || [];

  const deliveryEstimate = getDeliveryEstimate(tags);

  const hasLocalDelivery =

    tags.includes('shipping_local') ||

    tags.includes('shipping_local_free') ||

    tags.some((tag: string) => tag.startsWith('shipping_local_'));



  return (

    <main className="overflow-hidden bg-[#F1F1EC]">

      <section className="container mx-auto px-4 py-10 md:px-6 md:py-16">

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-6">

          <div className="lg:col-start-1 lg:row-start-1">

            <ProductGallery

              key={product.id}

              product={product}

              selectedVariant={selectedVariant}

              variantImageRequest={variantImageRequest}

              isOutOfStock={product.isOutOfStock}

              onImageSelected={handleGalleryImageSelected}

              onPrimaryImageReady={handlePrimaryImageReady}

            />

          </div>



          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">

            <div className="lg:sticky lg:top-28">

              <div className="rounded-[2rem] border border-[#D8DDD8] bg-white p-6 shadow-[0_12px_32px_rgba(17,17,17,0.07)] md:p-8">

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/15 bg-[#E7F0EB] px-4 py-2">

                  <Sparkles className="h-4 w-4 text-[#C8A45D]" />

                  <span className="text-sm font-bold text-[#0F5A46]">

                    IL Distributions LLC

                  </span>

                </div>



                <div className="mb-5 flex items-start justify-between gap-4">

                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#111111] sm:text-4xl md:text-5xl">

                    {product.title}

                  </h1>



                  <button

                    type="button"

                    onClick={handleWishlistToggle}

                    disabled={wishlistLoading}

                    aria-label={

                      isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'

                    }

                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 ${

                      isWishlisted

                        ? 'border-[#0F5A46]/20 bg-[#0F5A46] text-white'

                        : 'border-[#D8DDD8] bg-white text-[#111111] hover:border-[#0F5A46]/30 hover:bg-[#F5F5F5] hover:text-[#0F5A46]'

                    }`}

                  >

                    <Heart

                      className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`}

                    />

                  </button>

                </div>



                {visibleOptions.length > 0 && (

                  <div className="mb-5 space-y-4 border-b border-[#E7E9E6] pb-5">

                    {visibleOptions.map((option: any) => (

                      <div key={option.id || option.name}>

                        <div className="mb-2 flex items-center justify-between gap-3">

                          <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#0F5A46]">

                            {option.name}

                          </p>

                          {selectedOptions[option.name] && (

                            <span className="text-sm font-semibold text-[#717182]">

                              {selectedOptions[option.name]}

                            </span>

                          )}

                        </div>



                        <div className="flex flex-wrap gap-2">

                          {option.values.map((value: string) => {

                            const candidate = resolveVariantForOption(

                              option.name,

                              value

                            );

                            const isSelected =

                              selectedOptions[option.name] === value;

                            const isUnavailable =

                              !candidate ||

                              candidate.isOutOfStock ||

                              !candidate.availableForSale;



                            return (

                              <button

                                key={`${option.name}-${value}`}

                                type="button"

                                disabled={isUnavailable}

                                aria-pressed={isSelected}

                                aria-label={`${option.name}: ${value}${

                                  isUnavailable ? ' - Sold out' : ''

                                }`}

                                onClick={() => selectVariantFromOption(candidate)}

                                className={`relative min-h-11 rounded-xl border px-4 py-2 text-sm font-bold transition-[border-color,background-color,color,box-shadow,transform] duration-150 ${

                                  isSelected

                                    ? 'border-[#0F5A46] bg-[#E7F0EB] text-[#0F5A46] ring-2 ring-[#0F5A46]/10'

                                    : isUnavailable

                                      ? 'cursor-not-allowed border-[#D8DDD8] bg-[#F4F4F1] text-[#9CA3AF] line-through opacity-65'

                                      : 'border-[#D8DDD8] bg-white text-[#111111] hover:-translate-y-0.5 hover:border-[#0F5A46]/50 hover:text-[#0F5A46]'

                                }`}

                              >

                                {value}

                              </button>

                            );

                          })}

                        </div>

                      </div>

                    ))}

                  </div>

                )}



                {wishlistMessage && (

                  <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#0F5A46]/15 bg-[#E7F0EB] px-4 py-3 text-sm font-bold text-[#0F5A46]">

                    <Heart className="h-4 w-4 fill-current" />

                    {wishlistMessage}

                  </div>

                )}



                {wishlistAccessMessage && (

                  <div

                    role="status"

                    className="mb-5 flex items-start gap-3 rounded-2xl border border-[#D9C27D] bg-[#FBF5E3] px-4 py-4 text-sm text-[#5F4A18]"

                  >

                    <UserCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#8A6A24]" />

                    <div>

                      <p className="font-semibold leading-relaxed">

                        {wishlistAccessMessage}

                      </p>

                      <a

                        href={authLoginUrl}

                        className="mt-2 inline-flex font-extrabold text-[#0F5A46] underline decoration-[#0F5A46]/30 underline-offset-4 hover:decoration-[#0F5A46]"

                      >

                        Sign in or create an account

                      </a>

                    </div>

                  </div>

                )}



                <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-[#E7E9E6] pb-5">

                  <p className="text-3xl font-extrabold text-[#111111] md:text-4xl">

                    ${price.toFixed(2)}

                  </p>



                  {hasCompareAtPrice && (

                    <p className="text-xl font-bold text-[#9CA3AF] line-through md:text-2xl">

                      ${compareAtPrice.toFixed(2)}

                    </p>

                  )}



                  {hasCompareAtPrice && (

                    <span className="rounded-full bg-[#E7F0EB] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#0F5A46]">

                      Save {discountPercent}%

                    </span>

                  )}



                  <span

                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${

                      isSelectedVariantOutOfStock

                        ? 'bg-[#111111]/10 text-[#111111]'

                        : 'bg-[#F2E8CA] text-[#8A6A24]'

                    }`}

                  >

                    {isSelectedVariantOutOfStock ? 'Sold Out' : 'Available Now'}

                  </span>

                </div>



                <div className="mb-5 flex flex-col items-start gap-2">

                  <div className="inline-flex items-center gap-2 rounded-full bg-[#E7F0EB] px-4 py-2 text-sm font-bold text-[#0F5A46]">

                    <Truck className="h-4 w-4" />

                    {shippingLabel}

                  </div>



                  {deliveryEstimate && (

                    <div className="inline-flex items-center gap-2 rounded-full bg-[#F2E8CA] px-4 py-2 text-sm font-bold text-[#73591E]">

                      <Clock className="h-4 w-4" />

                      Estimated delivery: {deliveryEstimate}

                    </div>

                  )}

                </div>



                {hasLocalDelivery && (

                  <div className="mb-5 rounded-2xl border border-[#0F5A46]/20 bg-[#F1F6F3] p-5">

                    <div className="mb-3 flex items-center gap-2">

                      <Truck className="h-5 w-5 text-[#0F5A46]" />

                      <h3 className="font-bold text-[#0F5A46]">

                        Local Delivery Only

                      </h3>

                    </div>

                    <p className="mb-2 text-sm font-semibold text-[#111111]">

                      Available ZIP codes:

                    </p>

                    <p className="mb-4 text-sm text-[#111111]">

                      {LOCAL_DELIVERY_ZIPS.join(', ')}

                    </p>

                    <p className="text-sm text-[#717182]">

                      If your ZIP code is not listed, please contact us before

                      placing your order.

                    </p>

                  </div>

                )}



                {isSelectedVariantOutOfStock && (

                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <span>

                      This selection is currently unavailable. Please choose an

                      available option.

                    </span>

                  </div>

                )}



                {actionError && (

                  <div

                    role="alert"

                    className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"

                  >

                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                    {actionError}

                  </div>

                )}



                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <Button

                    onClick={handleAddToCart}

                    disabled={adding || isSelectedVariantOutOfStock}

                    className={`h-14 rounded-2xl px-8 text-base text-white transition-[transform,background-color] duration-200 active:scale-[0.98] ${

                      isSelectedVariantOutOfStock

                        ? 'cursor-not-allowed bg-[#717182] hover:bg-[#717182]'

                        : 'bg-[#0F5A46] hover:-translate-y-0.5 hover:bg-[#126B54]'

                    }`}

                  >

                    <ShoppingCart className="mr-2 h-5 w-5" />

                    {isSelectedVariantOutOfStock

                      ? 'Sold Out'

                      : adding

                        ? 'Adding...'

                        : 'Add to Cart'}

                  </Button>



                  <Button

                    onClick={handleBuyNow}

                    disabled={buying || isSelectedVariantOutOfStock}

                    variant="outline"

                    className={`h-14 rounded-2xl border-[#0F5A46] bg-white text-base transition-[transform,background-color,color] duration-200 active:scale-[0.98] ${

                      isSelectedVariantOutOfStock

                        ? 'cursor-not-allowed border-[#717182] text-[#717182] hover:bg-white hover:text-[#717182]'

                        : 'text-[#0F5A46] hover:-translate-y-0.5 hover:bg-[#0F5A46] hover:text-white'

                    }`}

                  >

                    {isSelectedVariantOutOfStock

                      ? 'Unavailable'

                      : buying

                        ? 'Opening checkout...'

                        : 'Buy Now'}

                    {!isSelectedVariantOutOfStock && (

                      <ArrowRight className="ml-2 h-5 w-5" />

                    )}

                  </Button>

                </div>



                {addedMessage && (

                  <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[#0F5A46]/15 bg-[#E7F0EB] px-4 py-3 text-sm font-bold text-[#0F5A46]">

                    <CheckCircle2 className="h-5 w-5" />

                    {addedMessage}

                  </div>

                )}



                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                  {productBenefits.map((benefit) => (

                    <BenefitCard key={benefit.label} {...benefit} />

                  ))}

                </div>

              </div>

            </div>

          </div>



          <div className="lg:col-start-1 lg:row-start-2">

            <MemoizedProductDescription

              html={product.descriptionHtml}

              tags={tags}

            />

          </div>

        </div>

      </section>



      <div className="[content-visibility:auto] [contain-intrinsic-size:700px]">

        <MemoizedRelatedProducts currentProduct={product} />

      </div>

    </main>

  );

}