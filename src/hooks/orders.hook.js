import axiosInstance from "@/lib/url";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useGetMenu({ search = "", limit = 10, page = 1 }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["menu", search, limit, page],
    queryFn: () =>
      axiosInstance.get(`/menu/search?query=${search}&limit=${limit}&page=${page}`, {
        params: {
          search,
          limit,
          page,
        },
      }),
    keepPreviousData: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 20,
  });

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["menu", search, limit, page],
      queryFn: () =>
        axiosInstance.get(`/menu/search?query=${search}&limit=${limit}&page=${page}`, {
          params: {
            search,
            limit,
            page,
          },
        }),
    });
  }, [queryClient, search, limit, page]);

  return query;
}
export function useGetSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["settings"],
    queryFn: () => axiosInstance.get(`/settings`),
    keepPreviousData: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 20,
  });

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["settings"],
      queryFn: () => axiosInstance.get(`/settings`),
    });
  }, [queryClient]);

  return query;
}

export function useCurateOrders() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => axiosInstance.post(`/orders/curate`, data),
  });

  return mutation;
}
export function useGetMenuContext() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => axiosInstance.post(`/menu/context`, data),
  });

  return mutation;
}

export function useSendOrders() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => axiosInstance.post(`/orders`, data),
    onSuccess: () => queryClient.invalidateQueries(["orders"]),
  });

  return mutation;
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => axiosInstance.post(`/settings`, data),
    onSuccess: () => queryClient.invalidateQueries(["settings"]),
  });

  return mutation;
}

export function useGetOrders({ page = 1, limit = 5 }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["orders", page, limit],
    queryFn: () =>
      axiosInstance.get(`/orders`, {
        params: {
          page,
          limit,
        },
      }),
    keepPreviousData: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 20,
  });

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["orders", page, limit],
      queryFn: () =>
        axiosInstance.get(`/orders`, {
          params: {
            page,
            limit,
          },
        }),
    });
  }, [page, limit, queryClient]);

  return query;
}

export function useGetOrderById(id) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["orders", id],
    queryFn: () => axiosInstance.get(`/orders/${id}`),
    keepPreviousData: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 20,
  });

  return query;
}
