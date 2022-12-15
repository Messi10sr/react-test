import React, { CSSProperties, useState } from 'react';
import {
  Typography,
  Card,
  Tree,
  Input,
  Popconfirm,
  Modal,
  TreeNodeProps,
  Button,
  Space,
} from '@arco-design/web-react';
import {
  IconPlusCircle as IconPlus,
  IconPen,
  IconDelete,
  IconEdit,
  IconFolderAdd,
  IconFolderDelete,
} from '@arco-design/web-react/icon';

import { addArticle, getArticle, initial, updateArticle } from './api';
import { ArticleEditor } from './components/ArticleEditor';
import { useRequest } from 'ahooks';
import { getMenu, MenuItem, updateMenu } from './api/menu';

const Title = Typography.Title;

function getParent(treeData, pathParentKeys) {
  const keys = pathParentKeys.slice();
  if (keys.length > 0) {
    const key = keys.shift();
    const node = treeData.find((item) => item.key === key);
    if (keys.length === 0) {
      return node;
    }
    return getParent(node.children, keys);
  }
  return null;
}

const iconStyle: CSSProperties = {
  fontSize: 22,
  color: '#3370ff',
  position: 'relative',
  top: 5,
};

function Index() {
  // 获取菜单数据
  const { data: treeData, mutate } = useRequest<MenuItem[], null>(getMenu);
  // 更新菜单数据
  const { run } = useRequest(updateMenu, { manual: true });

  // 当前编辑项，用于行内编辑文本框显示控制
  const [editedItem, setEditedItem] = useState(null);
  // 当前编辑的分类，用于新增项目时回显
  const [currentCategory, setCurrentCategory] = useState(null);
  // 当前编辑的文章，用于填充文章编辑表单
  const [article, setArticle] = useState(initial);
  // modal开关
  const [visible, setVisible] = useState(false);
  // modal标题
  const [modalTitle, setModalTitle] = useState(null);

  const renderTitle = (node: TreeNodeProps) => {
    if (editedItem && node.dataRef.key === editedItem.key) {
      return (
        <Input
          value={editedItem.title}
          autoFocus
          onChange={(value) => setEditedItem({ ...editedItem, title: value })}
          onBlur={() => setEditedItem(null)}
          onPressEnter={async (e) => {
            // 更新标题
            node.dataRef.title = e.target.value;
            // 提交更新
            run(treeData);
            // 退出编辑模式
            setEditedItem(null);
          }}
        ></Input>
      );
    }
    return <>{node.title}</>;
  };

  const renderExtra = (node: TreeNodeProps) => {
    // 根据节点类型生成不同菜单：
    // 1. category的操作有：修改分类名称、删除分类、新增子分类、新增文章
    // 2. article的操作有：删除文章、编辑文章
    if (node.dataRef.type === 'category') {
      return (
        <>
          {/* 编辑当前目录名称 */}
          <IconPen
            style={iconStyle}
            onClick={() => setEditedItem(node.dataRef)}
          />
          {/* 删除当前目录 */}
          <Popconfirm
            focusLock
            title="确认删除吗?"
            okText="确认"
            cancelText="取消"
            onOk={() => {
              // 找到父节点，从其children中删除当前节点
              if (node.parentKey) {
                const parentNode = getParent(treeData, node.pathParentKeys);
                parentNode.children = parentNode.children.filter(
                  (item) => item.key !== node.dataRef.key
                );
                // 执行更新菜单
                run(treeData);
                // 修改本地数据
                mutate(treeData);
              } else {
                // 没有父节点，说明是根节点，从treeData中删除
                const newData = treeData.filter(
                  (item) => item.key !== node.dataRef.key
                );
                // 执行更新菜单
                run(newData);
                // 修改本地数据
                mutate(newData);
              }
            }}
          >
            <IconFolderDelete style={iconStyle} />
          </Popconfirm>
          {/* 新增子目录 */}
          <IconFolderAdd
            style={iconStyle}
            onClick={() => {
              // 往本地菜单加一个目录项
              const dataChildren = node.dataRef.children || [];
              const newNode = {
                title: '输入分类名称',
                key: node._key + '-' + (dataChildren.length + 1),
                type: 'category',
              };
              dataChildren.push(newNode);
              node.dataRef.children = dataChildren;
              // 修改本地数据
              mutate(treeData);
              // 进入编辑模式
              setEditedItem(newNode);
            }}
          />
          {/* 新增文章 */}
          <IconPlus
            style={iconStyle}
            onClick={() => {
              // 打开新增弹窗并设置弹窗标题
              setVisible(true);
              setModalTitle('新增文章');
              // 设置文章所属分类节点
              setCurrentCategory(node.dataRef);
              // 设置文章数据对象
              setArticle({
                _id: '',
                title: '输入文章标题',
                content: '# 输入文章内容',
              });
            }}
          />
        </>
      );
    } else {
      return (
        <>
          <IconEdit
            style={iconStyle}
            onClick={async () => {
              // 编辑文章：
              // 1.设置文章所属分类用于更新回显
              const category = getParent(treeData, node.pathParentKeys);
              setCurrentCategory(category);
              // 2.打开弹窗、设置标题
              setVisible(true);
              setModalTitle(node.title);
              // 3.通过文章id获取其内容
              const articleId = node.dataRef.key;
              const result = await getArticle(articleId);
              setArticle(result.data);
            }}
          />
          <Popconfirm
            focusLock
            title="确认删除吗?"
            okText="确认"
            cancelText="取消"
            onOk={() => {
              // 确认删除
              // 找到父节点，删除当前节点
              if (node.parentKey) {
                const parentNode = getParent(treeData, node.pathParentKeys);
                parentNode.children = parentNode.children.filter(
                  (item) => item.key !== node.dataRef.key
                );
                // 更新菜单
                run(treeData);
                mutate(treeData);
              } else {
                const newData = treeData.filter(
                  (item) => item.key !== node.dataRef.key
                );
                // 更新菜单
                run(newData);
                mutate(newData);
              }
            }}
          >
            <IconDelete style={iconStyle} />
          </Popconfirm>
        </>
      );
    }
  };

  const onArticleSubmit = async () => {
    // 提交文章创建或更新请求
    // 1.如果正在编辑的article不存在id则为新增文章
    if (!article._id) {
      // 提交新增文章请求
      const { data } = await addArticle(article);

      // 构造一个菜单项
      const menuItem = {
        key: data._id,
        title: data.title,
        type: 'article',
      } as MenuItem;

      // 将新增的文章加入本地菜单
      if (!currentCategory) {
        // 根节点文章没有所属分类
        treeData.push(menuItem);
      } else {
        // 确保children存在
        if (!currentCategory.children) {
          currentCategory.children = [];
        }
        currentCategory.children.push(menuItem);
      }

      // 更新菜单
      run(treeData);
    } else {
      // 提交更新
      await updateArticle(article);
      // 更新一下本地数据
      let editArticle;
      if (!currentCategory) {
        // 根文章没有所属分类
        editArticle = treeData.find((item) => item.key === article._id);
      } else {
        // 从所属分类中找到对应菜单项
        editArticle = currentCategory.children.find(
          (item) => item.key === article._id
        );
      }
      editArticle.title = article.title;
      editArticle.content = article.content;
      // 更新成功，更新菜单
      run(treeData);
    }
    setVisible(false);
  };

  const addRootCategory = () => {
    const newNode = {
      key: '' + (treeData.length + 1),
      title: '输入分类名称',
      type: 'category',
      children: [],
    } as MenuItem;
    treeData.push(newNode);

    // 进入编辑模式
    setEditedItem(newNode);
  };

  const addRootArticle = () => {
    // 打开新增弹窗并设置弹窗标题
    setVisible(true);
    setModalTitle('新增文章');

    // 设置文章数据对象
    setArticle({
      _id: '',
      title: '输入文章标题',
      content: '# 输入文章内容',
    });
  };

  return (
    <>
      <Card>
        <Title heading={6}>文章管理</Title>
        <Tree
          size="large"
          treeData={treeData}
          renderTitle={renderTitle}
          renderExtra={renderExtra}
        ></Tree>
        {/* 创建根目录和文章 */}
        <Space>
          <Button onClick={addRootCategory}>添加分类</Button>
          <Button onClick={addRootArticle}>添加文章</Button>
        </Space>
        <Modal
          title={modalTitle}
          visible={visible}
          onOk={onArticleSubmit}
          onCancel={() => setVisible(false)}
          autoFocus={false}
          focusLock={true}
          style={{ width: '90vw' }}
        >
          <ArticleEditor
            article={article}
            setArticle={setArticle}
          ></ArticleEditor>
        </Modal>
      </Card>
    </>
  );
}

export default Index;
