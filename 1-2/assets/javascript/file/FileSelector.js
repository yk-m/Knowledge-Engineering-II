"use strict";

var FileSelector = function ( dropzone, onSelect ) {
	this.onSelect = onSelect;
	this.dropzone = dropzone;

	this.dropzone.addEventListener('dragover', this.handleDragOver, false);
	this.dropzone.addEventListener('drop', this.handleFileSelect.bind( this ), false);
	this.dropzone.addEventListener('dragenter', this.dragEnter.bind( this ), false);
	this.dropzone.addEventListener('dragleave', this.dragLeave.bind( this ), false);

	this.dragover_classname = "drag-over";
}

FileSelector.prototype.handleFileSelect = function ( evt ) {
	evt.stopPropagation();
	evt.preventDefault();

	this.dragLeave();
	this.onSelect( evt.dataTransfer.files );
}

FileSelector.prototype.handleDragOver = function ( evt ) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

FileSelector.prototype.dragLeave = function () {
	this.dropzone.classList.remove( this.dragover_classname );
}

FileSelector.prototype.dragEnter = function () {
	this.dropzone.classList.add( this.dragover_classname );
}