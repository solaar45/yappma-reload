# WealthBackend.Repo is an alias for the configured Yappma.Repo
# This allows both naming conventions to work in the codebase
defmodule WealthBackend.Repo do
  # Simply forward all calls to the actual configured repo
  defdelegate all(queryable, opts \\ []), to: Yappma.Repo
  defdelegate get(queryable, id, opts \\ []), to: Yappma.Repo
  defdelegate get!(queryable, id, opts \\ []), to: Yappma.Repo
  defdelegate get_by(queryable, clauses, opts \\ []), to: Yappma.Repo
  defdelegate get_by!(queryable, clauses, opts \\ []), to: Yappma.Repo
  defdelegate one(queryable, opts \\ []), to: Yappma.Repo
  defdelegate one!(queryable, opts \\ []), to: Yappma.Repo
  defdelegate insert(struct_or_changeset, opts \\ []), to: Yappma.Repo
  defdelegate insert!(struct_or_changeset, opts \\ []), to: Yappma.Repo
  defdelegate update(changeset, opts \\ []), to: Yappma.Repo
  defdelegate update!(changeset, opts \\ []), to: Yappma.Repo
  defdelegate delete(struct_or_changeset, opts \\ []), to: Yappma.Repo
  defdelegate delete!(struct_or_changeset, opts \\ []), to: Yappma.Repo
  defdelegate insert_or_update(changeset, opts \\ []), to: Yappma.Repo
  defdelegate insert_or_update!(changeset, opts \\ []), to: Yappma.Repo
  defdelegate insert_all(schema_or_source, entries, opts \\ []), to: Yappma.Repo
  defdelegate update_all(queryable, updates, opts \\ []), to: Yappma.Repo
  defdelegate delete_all(queryable, opts \\ []), to: Yappma.Repo
  defdelegate preload(struct_or_structs, preloads, opts \\ []), to: Yappma.Repo
  defdelegate transaction(fun_or_multi, opts \\ []), to: Yappma.Repo
  defdelegate rollback(value), to: Yappma.Repo
  defdelegate aggregate(queryable, aggregate, opts \\ []), to: Yappma.Repo
  defdelegate exists?(queryable, opts \\ []), to: Yappma.Repo
  defdelegate reload(struct, opts \\ []), to: Yappma.Repo
  defdelegate reload!(struct, opts \\ []), to: Yappma.Repo
end
