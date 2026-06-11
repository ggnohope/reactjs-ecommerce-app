import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AddressAPI, CartAPI, CatalogAPI, errorMessage, OrderAPI } from "./api";
import type { ProductFilters } from "./types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: CatalogAPI.categories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => CatalogAPI.products(filters),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(id: number | string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => CatalogAPI.product(id!),
    enabled: id !== undefined,
  });
}

export function useCart() {
  const { authenticated } = useAuth();
  return useQuery({
    queryKey: ["cart"],
    queryFn: CartAPI.get,
    enabled: authenticated,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      CartAPI.add(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast("Added to cart");
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (itemId: number) => CartAPI.remove(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (err) => toast(errorMessage(err), "err"),
  });
}

export function useOrders() {
  const { authenticated } = useAuth();
  return useQuery({ queryKey: ["orders"], queryFn: OrderAPI.list, enabled: authenticated });
}

export function useOrder(id: number | string | undefined) {
  const { authenticated } = useAuth();
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => OrderAPI.get(id!),
    enabled: authenticated && id !== undefined,
  });
}

export function useAddresses() {
  const { authenticated } = useAuth();
  return useQuery({ queryKey: ["addresses"], queryFn: AddressAPI.list, enabled: authenticated });
}
