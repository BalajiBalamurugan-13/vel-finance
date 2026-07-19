function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6 lg:mb-8">
      <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
        {title}
      </h1>

      {subtitle && (
        <p className="text-slate-400 text-sm lg:text-base mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default PageHeader;