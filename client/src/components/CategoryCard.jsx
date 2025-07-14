import { Link } from "react-router-dom"

const CategoryCard = ({ category }) => {
  // Map category names to URL-friendly versions while preserving the exact category name
  const getUrlCategory = (categoryName) => {
    return categoryName.toLowerCase().replace(/\s+/g, '-')
  }

  return (
    <Link
      to={`/vendors?category=${getUrlCategory(category.name)}`}
      className="card hover:shadow-lg transition-shadow group"
    >
      <div className="text-center">
        <div className="text-4xl mb-4">{category.icon}</div>
        <h3 className="text-xl font-semibold mb-2 group-hover:text-indigo-600 transition-colors">{category.name}</h3>
        <p className="text-gray-600">{category.description}</p>
      </div>
    </Link>
  )
}

export default CategoryCard
