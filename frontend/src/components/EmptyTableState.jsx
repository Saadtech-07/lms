export default function EmptyTableState({
  title,
  description = 'Try changing your search or filter criteria.',
  colSpan,
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </td>
    </tr>
  );
}
