import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * 警告对话框组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 触发对话框的元素
 * @param {boolean} props.open - 控制对话框是否打开
 * @param {Function} props.onOpenChange - 对话框打开状态变化时的回调函数
 * @param {string} props.title - 对话框标题
 * @param {string} props.description - 对话框描述内容
 * @param {string} props.confirmText - 确认按钮文本
 * @param {string} props.cancelText - 取消按钮文本
 * @param {Function} props.onConfirm - 点击确认按钮时的回调函数
 * @param {Function} props.onCancel - 点击取消按钮时的回调函数
 * @param {Object} props.confirmProps - 确认按钮的额外属性
 * @param {Object} props.cancelProps - 取消按钮的额外属性
 * @returns {React.ReactElement} 警告对话框组件
 */
export function ConfirmAlertDialog({
  children,
  open,
  onOpenChange,
  title = "",
  description = "",
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  confirmProps = {},
  cancelProps = {},
}) {
  // 内部状态管理，当外部未提供时使用
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  const handleOpenChange = (value) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    if (onOpenChange) {
      onOpenChange(value);
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (!isControlled) setInternalOpen(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (!isControlled) setInternalOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} {...cancelProps}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} {...confirmProps}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}