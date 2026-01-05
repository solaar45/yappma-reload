defmodule Yappma.Repo.Migrations.AddTransactionCategories do
  use Ecto.Migration

  def change do
    # Create transaction_categories table
    create table(:transaction_categories) do
      add :name, :string, null: false
      add :icon, :string
      add :color, :string
      add :type, :string, null: false  # "income" or "expense"
      add :is_system, :boolean, default: false
      add :user_id, references(:users, on_delete: :delete_all)

      timestamps(type: :utc_datetime)
    end

    create index(:transaction_categories, [:user_id])
    create unique_index(:transaction_categories, [:name, :user_id], name: :transaction_categories_name_user_id_index)

    # Add category_id to transactions
    alter table(:transactions) do
      add :category_id, references(:transaction_categories, on_delete: :nilify_all)
    end

    create index(:transactions, [:category_id])

    # Insert default system categories
    execute("""
      INSERT INTO transaction_categories (name, icon, color, type, is_system, inserted_at, updated_at)
      VALUES
        ('Salary', '💰', '#10b981', 'income', true, NOW(), NOW()),
        ('Investment Income', '📈', '#3b82f6', 'income', true, NOW(), NOW()),
        ('Gift', '🎁', '#ec4899', 'income', true, NOW(), NOW()),
        ('Refund', '↩️', '#8b5cf6', 'income', true, NOW(), NOW()),
        ('Other Income', '💵', '#6b7280', 'income', true, NOW(), NOW()),
        
        ('Groceries', '🛒', '#f59e0b', 'expense', true, NOW(), NOW()),
        ('Rent', '🏠', '#ef4444', 'expense', true, NOW(), NOW()),
        ('Utilities', '⚡', '#06b6d4', 'expense', true, NOW(), NOW()),
        ('Transportation', '🚗', '#84cc16', 'expense', true, NOW(), NOW()),
        ('Entertainment', '🎬', '#a855f7', 'expense', true, NOW(), NOW()),
        ('Dining Out', '🍽️', '#f97316', 'expense', true, NOW(), NOW()),
        ('Shopping', '🛍️', '#ec4899', 'expense', true, NOW(), NOW()),
        ('Healthcare', '⚕️', '#14b8a6', 'expense', true, NOW(), NOW()),
        ('Insurance', '🛡️', '#6366f1', 'expense', true, NOW(), NOW()),
        ('Subscriptions', '📱', '#8b5cf6', 'expense', true, NOW(), NOW()),
        ('Education', '📚', '#0ea5e9', 'expense', true, NOW(), NOW()),
        ('Travel', '✈️', '#06b6d4', 'expense', true, NOW(), NOW()),
        ('Other Expense', '💸', '#6b7280', 'expense', true, NOW(), NOW())
    """)
  end
end
