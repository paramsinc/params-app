export default [
  {
    language: 'markdown',
    content:
      'Title: Image classification from scratch\nAuthor: [fchollet](https://twitter.com/fchollet)\nDate created: 2020/04/27\nLast modified: 2023/11/09\nDescription: Training an image classifier from scratch on the Kaggle Cats vs Dogs dataset.\nAccelerator: GPU',
  },
  {
    language: 'markdown',
    content:
      '## Introduction\nThis example shows how to do image classification from scratch, starting from JPEG image files on disk, without leveraging pre-trained weights or a pre-made Keras Application model. We demonstrate the workflow on the Kaggle Cats vs Dogs binary classification dataset.\n\nWe use the `image_dataset_from_directory` utility to generate the datasets, and we use Keras image preprocessing layers for image standardization and data augmentation.',
  },
  {
    language: 'markdown',
    content: '## Setup',
  },
  {
    language: 'python',
    content:
      'import os\nimport numpy as np\nimport keras\nfrom keras import layers\nfrom tensorflow import data as tf_data\nimport matplotlib.pyplot as plt',
  },
  {
    language: 'markdown',
    content:
      "## Load the data: the Cats vs Dogs dataset\n### Raw data download\nFirst, let's download the 786M ZIP archive of the raw data:",
  },
  {
    language: 'shell',
    content:
      'curl -O https://download.microsoft.com/download/3/E/1/3E1C3F21-ECDB-4869-8368-6DEBA77B919F/kagglecatsanddogs_5340.zip',
  },
  {
    language: 'shell',
    content: 'unzip -q kagglecatsanddogs_5340.zip\nls',
  },
  {
    language: 'markdown',
    content:
      'Now we have a `PetImages` folder which contain two subfolders, `Cat` and `Dog`. Each subfolder contains image files for each category.',
  },
  {
    language: 'shell',
    content: 'ls PetImages',
  },
  {
    language: 'markdown',
    content:
      '### Filter out corrupted images\nWhen working with lots of real-world image data, corrupted images are a common occurence. Let\'s filter out badly-encoded images that do not feature the string "JFIF" in their header.',
  },
  {
    language: 'python',
    content:
      'num_skipped = 0\nfor folder_name in ("Cat", "Dog"):\n    folder_path = os.path.join("PetImages", folder_name)\n    for fname in os.listdir(folder_path):\n        fpath = os.path.join(folder_path, fname)\n        try:\n            fobj = open(fpath, "rb")\n            is_jfif = b"JFIF" in fobj.peek(10)\n        finally:\n            fobj.close()\n        if not is_jfif:\n            num_skipped += 1\n            # Delete corrupted image\n            os.remove(fpath)\nprint(f"Deleted {num_skipped} images.")',
  },
  {
    language: 'markdown',
    content: '## Generate a `Dataset`',
  },
  {
    language: 'python',
    content:
      'image_size = (180, 180)\nbatch_size = 128\ntrain_ds, val_ds = keras.utils.image_dataset_from_directory(\n    "PetImages",\n    validation_split=0.2,\n    subset="both",\n    seed=1337,\n    image_size=image_size,\n    batch_size=batch_size,\n)',
  },
  {
    language: 'markdown',
    content: '## Visualize the data\nHere are the first 9 images in the training dataset.',
  },
  {
    language: 'python',
    content:
      'plt.figure(figsize=(10, 10))\nfor images, labels in train_ds.take(1):\n    for i in range(9):\n        ax = plt.subplot(3, 3, i + 1)\n        plt.imshow(np.array(images[i]).astype("uint8"))\n        plt.title(int(labels[i]))\n        plt.axis("off")',
  },
  {
    language: 'markdown',
    content:
      "## Using image data augmentation\nWhen you don't have a large image dataset, it's a good practice to artificially introduce sample diversity by applying random yet realistic transformations to the training images, such as random horizontal flipping or small random rotations. This helps expose the model to different aspects of the training data while slowing down overfitting.",
  },
  {
    language: 'python',
    content:
      'data_augmentation_layers = [\n    layers.RandomFlip("horizontal"),\n    layers.RandomRotation(0.1),\n]\ndef data_augmentation(images):\n    for layer in data_augmentation_layers:\n        images = layer(images)\n    return images',
  },
  {
    language: 'markdown',
    content:
      "Let's visualize what the augmented samples look like, by applying `data_augmentation` repeatedly to the first few images in the dataset:",
  },
  {
    language: 'python',
    content:
      'plt.figure(figsize=(10, 10))\nfor images, _ in train_ds.take(1):\n    for i in range(9):\n        augmented_images = data_augmentation(images)\n        ax = plt.subplot(3, 3, i + 1)\n        plt.imshow(np.array(augmented_images[0]).astype("uint8"))\n        plt.axis("off")',
  },
  {
    language: 'markdown',
    content:
      '## Standardizing the data\nOur image are already in a standard size (180x180), as they are being yielded as contiguous `float32` batches by our dataset. However, their RGB channel values are in the `[0, 255]` range. This is not ideal for a neural network; in general you should seek to make your input values small. Here, we will standardize values to be in the `[0, 1]` by using a `Rescaling` layer at the start of our model.',
  },
  {
    language: 'markdown',
    content:
      "## Two options to preprocess the data\nThere are two ways you could be using the `data_augmentation` preprocessor:\n\n**Option 1: Make it part of the model**, like this:\n```python\ninputs = keras.Input(shape=input_shape)\nx = data_augmentation(inputs)\nx = layers.Rescaling(1./255)(x)\n...  # Rest of the model\n```\nWith this option, your data augmentation will happen *on device*, synchronously with the rest of the model execution, meaning that it will benefit from GPU acceleration.\nNote that data augmentation is inactive at test time, so the input samples will only be augmented during `fit()`, not when calling `evaluate()` or `predict()`.\nIf you're training on GPU, this may be a good option.\n**Option 2: apply it to the dataset**, so as to obtain a dataset that yields batches of augmented images, like this:\n```python\naugmented_train_ds = train_ds.map(\n    lambda x, y: (data_augmentation(x, training=True), y))\n```\nWith this option, your data augmentation will happen **on CPU**, asynchronously, and will be buffered before going into the model.\nIf you're training on CPU, this is the better option, since it makes data augmentation asynchronous and non-blocking.\nIn our case, we'll go with the second option. If you're not sure which one to pick, this second option (asynchronous preprocessing) is always a solid choice.",
  },
  {
    language: 'markdown',
    content:
      "## Configure the dataset for performance\nLet's apply data augmentation to our training dataset, and let's make sure to use buffered prefetching so we can yield data from disk without having I/O becoming blocking:",
  },
  {
    language: 'python',
    content:
      '# Apply `data_augmentation` to the training images.\ntrain_ds = train_ds.map(\n    lambda img, label: (data_augmentation(img), label),\n    num_parallel_calls=tf_data.AUTOTUNE,\n)\n# Prefetching samples in GPU memory helps maximize GPU utilization.\ntrain_ds = train_ds.prefetch(tf_data.AUTOTUNE)\nval_ds = val_ds.prefetch(tf_data.AUTOTUNE)',
  },
  {
    language: 'markdown',
    content:
      "## Build a model\nWe'll build a small version of the Xception network. We haven't particularly tried to optimize the architecture; if you want to do a systematic search for the best model configuration, consider using [KerasTuner](https://github.com/keras-team/keras-tuner).\nNote that:\n- We start the model with the `data_augmentation` preprocessor, followed by a `Rescaling` layer.\n- We include a `Dropout` layer before the final classification layer.",
  },
  {
    language: 'python',
    content:
      'def make_model(input_shape, num_classes):\n    inputs = keras.Input(shape=input_shape)\n    # Entry block\n    x = layers.Rescaling(1.0 / 255)(inputs)\n    x = layers.Conv2D(128, 3, strides=2, padding="same")(x)\n    x = layers.BatchNormalization()(x)\n    x = layers.Activation("relu")(x)\n    previous_block_activation = x  # Set aside residual\n    for size in [256, 512, 728]:\n        x = layers.Activation("relu")(x)\n        x = layers.SeparableConv2D(size, 3, padding="same")(x)\n        x = layers.BatchNormalization()(x)\n        x = layers.Activation("relu")(x)\n        x = layers.SeparableConv2D(size, 3, padding="same")(x)\n        x = layers.BatchNormalization()(x)\n        x = layers.MaxPooling2D(3, strides=2, padding="same")(x)\n        # Project residual\n        residual = layers.Conv2D(size, 1, strides=2, padding="same")(\n            previous_block_activation\n        )\n        x = layers.add([x, residual])  # Add back residual\n        previous_block_activation = x  # Set aside next residual\n    x = layers.SeparableConv2D(1024, 3, padding="same")(x)\n    x = layers.BatchNormalization()(x)\n    x = layers.Activation("relu")(x)\n    x = layers.GlobalAveragePooling2D()(x)\n    if num_classes == 2:\n        units = 1\n    else:\n        units = num_classes\n    x = layers.Dropout(0.25)(x)\n    # We specify activation=None so as to return logits\n    outputs = layers.Dense(units, activation=None)(x)\n    return keras.Model(inputs, outputs)\nmodel = make_model(input_shape=image_size + (3,), num_classes=2)\nkeras.utils.plot_model(model, show_shapes=True)',
  },
  {
    language: 'markdown',
    content: '## Train the model',
  },
  {
    language: 'python',
    content:
      'epochs = 25\ncallbacks = [\n    keras.callbacks.ModelCheckpoint("save_at_{epoch}.keras"),\n]\nmodel.compile(\n    optimizer=keras.optimizers.Adam(3e-4),\n    loss=keras.losses.BinaryCrossentropy(from_logits=True),\n    metrics=[keras.metrics.BinaryAccuracy(name="acc")],\n)\nmodel.fit(\n    train_ds,\n    epochs=epochs,\n    callbacks=callbacks,\n    validation_data=val_ds,\n)',
  },
  {
    language: 'markdown',
    content:
      'We get to >90% validation accuracy after training for 25 epochs on the full dataset (in practice, you can train for 50+ epochs before validation performance starts degrading).',
  },
  {
    language: 'markdown',
    content:
      '## Run inference on new data\nNote that data augmentation and dropout are inactive at inference time.',
  },
  {
    language: 'python',
    content:
      'img = keras.utils.load_img("PetImages/Cat/6779.jpg", target_size=image_size)\nplt.imshow(img)\nimg_array = keras.utils.img_to_array(img)\nimg_array = keras.ops.expand_dims(img_array, 0)  # Create batch axis\npredictions = model.predict(img_array)\nscore = float(keras.ops.sigmoid(predictions[0][0]))\nprint(f"This image is {100 * (1 - score):.2f}% cat and {100 * score:.2f}% dog.")',
  },
]
