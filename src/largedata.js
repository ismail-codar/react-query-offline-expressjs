import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import * as React from "react";

export const itemKeys = {
  all: () => ["largedata"],
  list: () => [...itemKeys.all(), "list"],
  details: () => [...itemKeys.all(), "detail"],
  detail: (id) => [...itemKeys.details(), id],
};

export const useData = (itemId) => {
  const queryClient = useQueryClient();

  const itemQuery = useQuery(itemKeys.detail(itemId), () =>
    api.fetchData(itemId)
  );

  const [comment, setComment] = React.useState();

  const updateData = useMutation({
    mutationKey: itemKeys.detail(itemId),
    onMutate: async () => {
      await queryClient.cancelQueries(itemKeys.detail(itemId));
      const previousData = queryClient.getQueryData(itemKeys.detail(itemId));

      // remove local state so that server state is taken instead
      setComment(undefined);

      queryClient.setQueryData(itemKeys.detail(itemId), {
        ...previousData,
        item: {
          ...previousData.item,
          comment,
        },
      });

      return { previousData };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(itemKeys.detail(itemId), context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(itemKeys.detail(itemId));
    },
  });

  return {
    comment: comment ?? itemQuery.data?.item.comment,
    setComment,
    updateData,
    itemQuery,
  };
};
