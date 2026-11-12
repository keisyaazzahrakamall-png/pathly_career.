export function el(tag, text = '', className = '') {
  const node = document.createElement(tag);
  if (text !== '') node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function dateLabel(value) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}
export function nameOf(profile) {
  return profile?.full_name?.trim() || `Account ${profile?.id?.slice(0, 8) || ''}`;
}
export function showStatus(node, text, error = false) {
  node.textContent = text;
  node.classList.toggle('is-error', error);
  node.classList.toggle('is-success', Boolean(text) && !error);
}
export function renderFeedback(container, items, nameForId = () => 'Supervisor') {
  container.replaceChildren();
  if (!items.length) {
    container.append(el('p', 'No feedback yet. Guidance from your supervisor will appear here.', 'dash-empty'));
    return;
  }
  for (const item of items) {
    const card = el('article', '', 'feedback-card');
    const header = el('div', '', 'feedback-heading');
    header.append(el('strong', nameForId(item.supervisor_id)), el('time', dateLabel(item.created_at)));
    card.append(header, el('span', item.career_name || 'General guidance', 'dash-tag'), el('p', item.body, 'feedback-body'));
    container.append(card);
  }
}
export function createProgress(progress) {
  const box = el('div', '', 'dash-progress');
  const meter = document.createElement('progress');
  meter.max = 100;
  meter.value = progress.percent;
  meter.setAttribute('aria-label', `Roadmap progress: ${progress.percent}%`);
  box.append(el('span', `${progress.percent}% · ${progress.completed}/${progress.total} tasks`), meter);
  return box;
}
export function addCell(row, content) {
  const cell = el('td');
  cell.append(typeof content === 'string' ? document.createTextNode(content) : content);
  row.append(cell);
  return cell;
}
export function option(value, label) {
  const node = el('option', label);
  node.value = value;
  return node;
}
