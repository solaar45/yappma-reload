defmodule Yappma.Repo.Migrations.CreateTransactionCategories do
  use Ecto.Migration

  def change do
    create table(:transaction_categories) do
      add :name, :string, null: false
      add :icon, :string
      add :color, :string
      add :type, :string, null: false # "income" or "expense"
      add :parent_id, references(:transaction_categories, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:transaction_categories, [:type])
    create index(:transaction_categories, [:parent_id])

    # Add category_id to transactions
    alter table(:transactions) do
      add :category_id, references(:transaction_categories, on_delete: :nilify_all)
      add :notes, :text
    end

    create index(:transactions, [:category_id])

    # Insert default categories
    execute("""
    INSERT INTO transaction_categories (name, icon, color, type, inserted_at, updated_at) VALUES
    ('Salary', '💼', '#10b981', 'income', NOW(), NOW()),
    ('Investment Income', '📈', '#10b981', 'income', NOW(), NOW()),
    ('Gift', '🎁', '#10b981', 'income', NOW(), NOW()),
    ('Other Income', '💰', '#10b981', 'income', NOW(), NOW()),
    
    ('Groceries', '🛒', '#ef4444', 'expense', NOW(), NOW()),
    ('Restaurant', '🍽️', '#ef4444', 'expense', NOW(), NOW()),
    ('Transport', '🚗', '#f59e0b', 'expense', NOW(), NOW()),
    ('Shopping', '🛍️', '#8b5cf6', 'expense', NOW(), NOW()),
    ('Entertainment', '🎬', '#ec4899', 'expense', NOW(), NOW()),
    ('Bills & Utilities', '📱', '#3b82f6', 'expense', NOW(), NOW()),
    ('Rent', '🏠', '#ef4444', 'expense', NOW(), NOW()),
    ('Healthcare', '⚕️', '#06b6d4', 'expense', NOW(), NOW()),
    ('Insurance', '🛡️', '#3b82f6', 'expense', NOW(), NOW()),
    ('Education', '📚', '#8b5cf6', 'expense', NOW(), NOW()),
    ('Other Expense', '💸', '#6b7280', 'expense', NOW(), NOW())
    """)
  end
end
