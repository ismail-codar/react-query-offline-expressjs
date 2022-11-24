import * as React from "react";

import {
  useQuery,
  QueryClient,
  MutationCache,
  onlineManager,
  useIsRestoring,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import toast, { Toaster } from "react-hot-toast";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  Link,
  Outlet,
  ReactLocation,
  Router,
  useMatch,
} from "@tanstack/react-location";

import * as api from "./api";
import { itemKeys, useData } from "./largedata";

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const location = new ReactLocation();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 2000,
      retry: Infinity,
    },
    mutations: {
      retry: Infinity,
    }
  },
  // configure global cache callbacks to show toast notifications
  mutationCache: new MutationCache({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }),
});

// we need a default mutation function so that paused mutations can resume after a page reload
queryClient.setMutationDefaults(itemKeys.all(), {
  mutationFn: async ({ id, comment }) => {
    // to avoid clashes with our optimistic update when an offline mutation continues
    await queryClient.cancelQueries(itemKeys.detail(id));
    return api.updateData(id, comment);
  },
});

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        // resume mutations after initial restore from localStorage was successful
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries();
        });
      }}
    >
      <LargeData />
      <ReactQueryDevtools />
    </PersistQueryClientProvider>
  );
}

function LargeData() {
  const isRestoring = useIsRestoring();
  return (
    <Router
      location={location}
      routes={[
        {
          path: "/",
          element: <List />,
        },
        {
          path: ":itemId",
          element: <Detail />,
          errorElement: <DataError />,
          loader: ({ params: { itemId } }) =>
            queryClient.getQueryData(itemKeys.detail(itemId)) ??
            // do not load if we are offline or hydrating because it returns a promise that is pending until we go online again
            // we just let the Detail component handle it
            (onlineManager.isOnline() && !isRestoring
              ? queryClient.fetchQuery(itemKeys.detail(itemId), () =>
                  api.fetchData(itemId)
                )
              : undefined),
        },
      ]}
    >
      <Outlet />
      <Toaster />
    </Router>
  );
}

function List() {
  const largeDataQuery = useQuery(itemKeys.list(), api.fetchLargeData);

  if (largeDataQuery.isLoading && largeDataQuery.isFetching) {
    return "Loading...";
  }

  if (largeDataQuery.data) {
    return (
      <div>
        <ul style={{overflow:"auto", maxHeight:"500px"}}>
          {largeDataQuery.data.largedata.map((item) => (
            <li key={item.id}>
              <Link to={`./${item.id}`} preload>
                {item.id}- {item.title}<br/>
              </Link>
              {item.comment}<br/>
            </li>
          ))}
        </ul>
        <div>
          Updated at: {new Date(largeDataQuery.data.ts).toLocaleTimeString()}
        </div>
        <div>{largeDataQuery.isFetching && "fetching..."}</div>
      </div>
    );
  }

  // query will be in 'idle' fetchStatus while restoring from localStorage
  return null;
}

function DataError() {
  const { error } = useMatch();

  return (
    <div>
      <Link to="..">Back</Link>
      <h1>Couldn't load item!</h1>
      <div>{error.message}</div>
    </div>
  );
}

function Detail() {
  const {
    params: { itemId },
  } = useMatch();
  const { comment, setComment, updateData, itemQuery } = useData(itemId);

  if (itemQuery.isLoading && itemQuery.isFetching) {
    return "Loading...";
  }

  function submitForm(event) {
    event.preventDefault();

    updateData.mutate({
      id: itemId,
      comment,
    });
  }

  if (itemQuery.data) {
    return (
      <form onSubmit={submitForm}>
        <Link to="..">Back</Link>
        <h1>Data: {itemQuery.data.item.title}</h1>
        <p>
          Try to mock offline behaviour with the button in the devtools, then
          update the comment. The optimistic update will succeed, but the actual
          mutation will be paused and resumed once you go online again.
        </p>
        <p>
          You can also reload the page, which will make the persisted mutation
          resume, as you will be online again when you "come back".
        </p>
        <p>
          <label>
            Comment: <br />
            <textarea
              name="comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>
        </p>
        <button type="submit">Submit</button>
        <div>
          Updated at: {new Date(itemQuery.data.ts).toLocaleTimeString()}
        </div>
        <div>{itemQuery.isFetching && "fetching..."}</div>
        <div>
          {updateData.isPaused
            ? "mutation paused - offline"
            : updateData.isLoading && "updating..."}
        </div>
      </form>
    );
  }

  if (itemQuery.isPaused) {
    return "We're offline and have no data to show :(";
  }

  return null;
}
