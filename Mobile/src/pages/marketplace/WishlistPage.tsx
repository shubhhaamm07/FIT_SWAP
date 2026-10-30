import { ListingCard } from "../../components/marketplace/ListingCard";
import { Empty, Header, LoadState, Page } from "../../components/ui/index";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import type { Envelope, Listing } from "../../types/domain";

export function SavedScreen({ navigation }: ScreenProps<"Saved">) {
  const state =
    useResource<Envelope<{ listing: Listing }[]>>("/saved-listings");
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="Saved for later"
        subtitle="Good finds deserve a second look."
        back
      />
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      <ResponsiveGrid>
        {state.data?.data.map(({ listing }) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onPress={() => navigation.navigate("Listing", { id: listing.id })}
          />
        ))}
      </ResponsiveGrid>
      {!state.loading && !state.error && !state.data?.data.length && (
        <Empty
          title="Save your next possibility"
          body="Tap Save membership on a listing to keep it here."
        />
      )}
    </Page>
  );
}
