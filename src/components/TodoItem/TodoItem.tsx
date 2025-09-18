/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import classNames from 'classnames';
import { Todo } from '../../types/Todo';
import { useState } from 'react';

type Props = {
  todo: Todo;
  onDelete: (todoId: number) => Promise<void>;
  isProcessed: boolean;
  onToggleStatus: (todoId: number, completed: boolean) => Promise<void>;
  onTitleEdit: (
    todoId: number,
    completed: boolean,
    newTitle: string,
  ) => Promise<void>;
};

export const TodoItem: React.FC<Props> = ({
  todo,
  onDelete,
  isProcessed,
  onToggleStatus,
  onTitleEdit,
}) => {
  const [isEditFormActive, setIsEditFormActive] = useState(false);
  const [newTitle, setNewTitle] = useState(`${todo.title}`);

  const editTitle = () => {
    const promise = newTitle
      ? newTitle === todo.title
        ? Promise.resolve()
        : onTitleEdit(todo.id, todo.completed, newTitle)
      : onDelete(todo.id);

    promise.then(() => setIsEditFormActive(false));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    editTitle();
  };

  document.addEventListener('keyup', event => {
    if (event.key === 'Escape') {
      setIsEditFormActive(false);
    }
  });

  return (
    <div
      data-cy="Todo"
      className={classNames('todo', { completed: todo.completed })}
      onDoubleClick={() => setIsEditFormActive(true)}
    >
      <label className="todo__status-label">
        <input
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={todo.completed}
          onChange={() => onToggleStatus(todo.id, !todo.completed)}
          disabled={isProcessed}
        />
      </label>

      {!isEditFormActive && (
        <>
          <span data-cy="TodoTitle" className="todo__title">
            {todo.title}
          </span>

          <button
            type="button"
            className="todo__remove"
            data-cy="TodoDelete"
            onClick={() => {
              onDelete(todo.id);
            }}
          >
            ×
          </button>
        </>
      )}

      {isEditFormActive && (
        <form onSubmit={handleSubmit}>
          <input
            data-cy="TodoTitleField"
            type="text"
            className="todo__title-field"
            placeholder="Empty todo will be deleted"
            value={newTitle}
            onChange={event => setNewTitle(event.target.value)}
            autoFocus={true}
            onBlur={() => {
              editTitle();
            }}
          />
        </form>
      )}

      <div
        data-cy="TodoLoader"
        className={classNames('modal overlay', {
          'is-active': isProcessed,
        })}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );
};
