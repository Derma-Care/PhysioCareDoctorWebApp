import React from 'react';

const TemplateModal = ({ templates, onClose, onSelect }) => {
  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Select a Template</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {templates.length === 0 ? (
              <p>No templates saved.</p>
            ) : (
              <ul className="list-group">
                {templates.map((template, i) => {
                  let label = `Template ${i + 1}`;
                  try {
                    const meds = JSON.parse(template);
                    label = meds.map(m => m.name).join(', ');
                  } catch {}
                  return (
                    <li
                      key={i}
                      className="list-group-item list-group-item-action"
                      onClick={() => {
                        onSelect(template);
                        onClose();
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
